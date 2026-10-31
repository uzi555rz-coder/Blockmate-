package com.blockmate.nativebridge

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.ComponentName
import android.content.Context
import android.graphics.Path
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityManager
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.roundToInt

class BlockMateAccessibilityService : AccessibilityService() {
  companion object {
    const val MINECRAFT_PACKAGE = "com.mojang.minecraftpe"
    const val REFERENCE_WIDTH = 2400.0
    const val REFERENCE_HEIGHT = 1080.0

    @Volatile
    var instance: BlockMateAccessibilityService? = null
      private set

    fun isEnabled(context: Context): Boolean {
      val manager = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
      val expected = ComponentName(context, BlockMateAccessibilityService::class.java)
      return manager.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
        .any { info ->
          val service = info.resolveInfo?.serviceInfo ?: return@any false
          ComponentName(service.packageName, service.name) == expected
        }
    }
  }

  private val stopRequested = AtomicBoolean(true)
  @Volatile private var lastStatus = "service_connected"
  @Volatile private var lastForegroundPackage = ""

  override fun onServiceConnected() {
    super.onServiceConnected()
    instance = this
    serviceInfo = serviceInfo.apply {
      eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or AccessibilityEvent.TYPE_WINDOWS_CHANGED
      feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
      notificationTimeout = 100
      flags = flags or AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
    }
    lastStatus = "service_connected"
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    val packageName = event?.packageName?.toString() ?: return
    lastForegroundPackage = packageName
    if (packageName == MINECRAFT_PACKAGE) {
      lastStatus = "minecraft_foreground"
    } else if (!stopRequested.get()) {
      stopAutomation()
      lastStatus = "minecraft_left_foreground"
    }
  }

  override fun onInterrupt() {
    stopAutomation()
    lastStatus = "interrupted"
  }

  override fun onDestroy() {
    stopAutomation()
    if (instance === this) instance = null
    super.onDestroy()
  }

  fun beginAutomation(): Map<String, Any> {
    stopRequested.set(false)
    lastStatus = "armed"
    return statusSnapshot()
  }

  fun stopAutomation(): Map<String, Any> {
    stopRequested.set(true)
    lastStatus = "stopped"
    return statusSnapshot()
  }

  fun statusSnapshot(): Map<String, Any> {
    val display = displaySize()
    return mapOf(
      "serviceEnabled" to true,
      "minecraftForeground" to isMinecraftForeground(),
      "packageName" to (lastForegroundPackage.ifEmpty { MINECRAFT_PACKAGE }),
      "displayWidth" to display.first,
      "displayHeight" to display.second,
      "referenceWidth" to REFERENCE_WIDTH.toInt(),
      "referenceHeight" to REFERENCE_HEIGHT.toInt(),
      "armed" to !stopRequested.get(),
      "lastStatus" to lastStatus,
    )
  }

  fun tapReference(referenceX: Double, referenceY: Double): Map<String, Any> {
    if (!readyForGesture()) return failureSnapshot("gesture_rejected")

    val (x, y) = mapReferencePoint(referenceX, referenceY)
    val path = Path().apply { moveTo(x, y) }
    val gesture = android.accessibilityservice.GestureDescription.Builder()
      .addStroke(android.accessibilityservice.GestureDescription.StrokeDescription(path, 0L, 80L))
      .build()

    val accepted = dispatchGesture(gesture, callback("tap"), null)
    lastStatus = if (accepted) "tap_dispatched" else "tap_rejected"
    return statusSnapshot()
  }

  fun swipeReference(
    startX: Double,
    startY: Double,
    endX: Double,
    endY: Double,
    durationMs: Long,
  ): Map<String, Any> {
    if (!readyForGesture()) return failureSnapshot("gesture_rejected")

    val (x1, y1) = mapReferencePoint(startX, startY)
    val (x2, y2) = mapReferencePoint(endX, endY)
    val path = Path().apply {
      moveTo(x1, y1)
      lineTo(x2, y2)
    }
    val gesture = android.accessibilityservice.GestureDescription.Builder()
      .addStroke(
        android.accessibilityservice.GestureDescription.StrokeDescription(
          path,
          0L,
          durationMs.coerceIn(80L, 5_000L),
        ),
      )
      .build()

    val accepted = dispatchGesture(gesture, callback("swipe"), null)
    lastStatus = if (accepted) "swipe_dispatched" else "swipe_rejected"
    return statusSnapshot()
  }

  private fun callback(kind: String): GestureResultCallback = object : GestureResultCallback() {
    override fun onCompleted(gestureDescription: android.accessibilityservice.GestureDescription?) {
      lastStatus = "${kind}_completed"
    }

    override fun onCancelled(gestureDescription: android.accessibilityservice.GestureDescription?) {
      lastStatus = "${kind}_cancelled"
    }
  }

  private fun readyForGesture(): Boolean {
    if (stopRequested.get()) {
      lastStatus = "not_armed"
      return false
    }
    if (!isMinecraftForeground()) {
      lastStatus = "minecraft_not_foreground"
      return false
    }
    val (width, height) = displaySize()
    if (width <= height) {
      lastStatus = "landscape_required"
      return false
    }
    return true
  }

  private fun isMinecraftForeground(): Boolean {
    val activePackage = rootInActiveWindow?.packageName?.toString()
    return activePackage == MINECRAFT_PACKAGE || (activePackage == null && lastForegroundPackage == MINECRAFT_PACKAGE)
  }

  private fun displaySize(): Pair<Int, Int> {
    val metrics = resources.displayMetrics
    return metrics.widthPixels to metrics.heightPixels
  }

  private fun mapReferencePoint(referenceX: Double, referenceY: Double): Pair<Float, Float> {
    val (width, height) = displaySize()
    val x = (referenceX.coerceIn(0.0, REFERENCE_WIDTH) / REFERENCE_WIDTH * width).roundToInt().toFloat()
    val y = (referenceY.coerceIn(0.0, REFERENCE_HEIGHT) / REFERENCE_HEIGHT * height).roundToInt().toFloat()
    return x to y
  }

  private fun failureSnapshot(status: String): Map<String, Any> {
    lastStatus = status
    return statusSnapshot()
  }
}
