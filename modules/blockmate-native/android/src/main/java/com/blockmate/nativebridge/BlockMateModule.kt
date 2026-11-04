package com.blockmate.nativebridge

import android.content.Context
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BlockMateModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context is unavailable")

  override fun definition() = ModuleDefinition {
    Name("BlockMateNative")
    Events("status")

    AsyncFunction("isAccessibilityEnabled") {
      BlockMateAccessibilityService.isEnabled(context)
    }

    AsyncFunction("openAccessibilitySettings") {
      context.startActivity(
        Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
      )
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("getStatus") {
      BlockMateAccessibilityService.instance?.statusSnapshot() ?: mapOf(
        "serviceEnabled" to BlockMateAccessibilityService.isEnabled(context),
        "minecraftForeground" to false,
        "displayWidth" to context.resources.displayMetrics.widthPixels,
        "displayHeight" to context.resources.displayMetrics.heightPixels,
        "referenceWidth" to BlockMateAccessibilityService.REFERENCE_WIDTH.toInt(),
        "referenceHeight" to BlockMateAccessibilityService.REFERENCE_HEIGHT.toInt(),
        "armed" to false,
        "lastStatus" to "service_unavailable",
      )
    }

    AsyncFunction("arm") {
      requireService().beginAutomation()
    }

    AsyncFunction("stop") {
      requireService().stopAutomation()
    }

    AsyncFunction("tapReference") { x: Double, y: Double ->
      requireService().tapReference(x, y)
    }

    AsyncFunction("swipeReference") {
      startX: Double,
      startY: Double,
      endX: Double,
      endY: Double,
      durationMs: Double,
      ->
      requireService().swipeReference(startX, startY, endX, endY, durationMs.toLong())
    }
  }

  private fun requireService(): BlockMateAccessibilityService {
    return BlockMateAccessibilityService.instance
      ?: throw IllegalStateException("Enable BlockMate Minecraft controls in Android Accessibility settings first")
  }
}
