package com.blockmate.nativebridge

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.graphics.Bitmap
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.IBinder
import android.util.DisplayMetrics
import androidx.core.app.NotificationCompat
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.atomic.AtomicBoolean

class BlockMateScreenCaptureService : Service() {
  companion object {
    const val EXTRA_RESULT_CODE = "resultCode"
    const val EXTRA_RESULT_DATA = "resultData"
    private const val CHANNEL_ID = "blockmate_screen_capture"
    private const val NOTIFICATION_ID = 4101

    @Volatile var lastStatus: String = "screen_capture_idle"
      private set
    @Volatile var lastCapturePath: String? = null
      private set
    @Volatile var lastWidth: Int = 0
      private set
    @Volatile var lastHeight: Int = 0
      private set

    fun snapshot() = mapOf(
      "capturing" to (lastStatus == "screen_capture_running"),
      "lastStatus" to lastStatus,
      "lastCapturePath" to lastCapturePath,
      "width" to lastWidth,
      "height" to lastHeight,
    )

    fun markStatus(status: String) {
      lastStatus = status
    }
  }

  private var projection: MediaProjection? = null
  private var virtualDisplay: VirtualDisplay? = null
  private var imageReader: ImageReader? = null
  private val saved = AtomicBoolean(false)

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val resultCode = intent?.getIntExtra(EXTRA_RESULT_CODE, 0) ?: 0
    val resultData = if (Build.VERSION.SDK_INT >= 33) {
      intent?.getParcelableExtra(EXTRA_RESULT_DATA, Intent::class.java)
    } else {
      @Suppress("DEPRECATION") intent?.getParcelableExtra(EXTRA_RESULT_DATA)
    }
    if (resultCode == 0 || resultData == null) {
      lastStatus = "screen_capture_missing_consent"
      stopSelf()
      return START_NOT_STICKY
    }

    startForeground(NOTIFICATION_ID, buildNotification())
    startCapture(resultCode, resultData)
    return START_NOT_STICKY
  }

  private fun startCapture(resultCode: Int, resultData: Intent) {
    lastStatus = "screen_capture_running"
    saved.set(false)
    val manager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
    projection = manager.getMediaProjection(resultCode, resultData)
    val metrics = DisplayMetrics()
    @Suppress("DEPRECATION") display?.getRealMetrics(metrics)
    val width = metrics.widthPixels.coerceAtLeast(1)
    val height = metrics.heightPixels.coerceAtLeast(1)
    lastWidth = width
    lastHeight = height
    imageReader = ImageReader.newInstance(width, height, android.graphics.PixelFormat.RGBA_8888, 2)
    imageReader?.setOnImageAvailableListener({ reader -> saveLatestFrame(reader) }, null)
    virtualDisplay = projection?.createVirtualDisplay(
      "BlockMateScreenCapture",
      width,
      height,
      metrics.densityDpi,
      DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
      imageReader?.surface,
      null,
      null,
    )
    if (virtualDisplay == null) {
      lastStatus = "screen_capture_failed"
      stopCapture()
    }
  }

  private fun saveLatestFrame(reader: ImageReader) {
    if (!saved.compareAndSet(false, true)) return
    try {
      val image = reader.acquireLatestImage() ?: run {
        saved.set(false)
        return
      }
      val plane = image.planes[0]
      val buffer = plane.buffer
      val pixelStride = plane.pixelStride
      val rowStride = plane.rowStride
      val rowPadding = rowStride - pixelStride * image.width
      val bitmap = Bitmap.createBitmap(
        image.width + rowPadding / pixelStride,
        image.height,
        Bitmap.Config.ARGB_8888,
      )
      bitmap.copyPixelsFromBuffer(buffer)
      image.close()
      val cropped = if (bitmap.width != image.width) Bitmap.createBitmap(bitmap, 0, 0, image.width, image.height) else bitmap
      val file = File(cacheDir, "blockmate-latest-screen.png")
      FileOutputStream(file).use { output -> cropped.compress(Bitmap.CompressFormat.PNG, 100, output) }
      if (cropped !== bitmap) bitmap.recycle()
      cropped.recycle()
      lastCapturePath = file.absolutePath
      lastStatus = "screen_capture_ready"
    } catch (_: Throwable) {
      lastStatus = "screen_capture_failed"
    } finally {
      stopCapture()
    }
  }

  private fun stopCapture() {
    imageReader?.setOnImageAvailableListener(null, null)
    imageReader?.close()
    imageReader = null
    virtualDisplay?.release()
    virtualDisplay = null
    projection?.stop()
    projection = null
    stopForeground(STOP_FOREGROUND_REMOVE)
    stopSelf()
  }

  private fun buildNotification(): Notification = NotificationCompat.Builder(this, CHANNEL_ID)
    .setSmallIcon(android.R.drawable.ic_menu_view)
    .setContentTitle("BlockMate screen recognition")
    .setContentText("Capturing one Minecraft screen for local analysis")
    .setOngoing(true)
    .build()

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(CHANNEL_ID, "Screen recognition", NotificationManager.IMPORTANCE_LOW)
      getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null
  override fun onDestroy() {
    stopCapture()
    super.onDestroy()
  }
}
