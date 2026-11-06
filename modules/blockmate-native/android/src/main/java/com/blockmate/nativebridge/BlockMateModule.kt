package com.blockmate.nativebridge

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.provider.Settings
import androidx.core.content.ContextCompat
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.runBlocking

class BlockMateModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context is unavailable")
  private lateinit var screenCaptureLauncher: AppContextActivityResultLauncher<String, ScreenCaptureResult>

  override fun definition() = ModuleDefinition {
    Name("BlockMateNative")
    Events("status")

    RegisterActivityContracts {
      screenCaptureLauncher = registerForActivityResult(ScreenCaptureContract())
    }

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

    AsyncFunction("requestScreenCapture") {
      runBlocking {
        val result = screenCaptureLauncher.launch("blockmate_screen_capture")
        if (result.resultCode != Activity.RESULT_OK || result.data == null) {
          BlockMateScreenCaptureService.markStatus("screen_capture_denied")
          return@runBlocking BlockMateScreenCaptureService.snapshot()
        }
        val startIntent = Intent(context, BlockMateScreenCaptureService::class.java).apply {
          putExtra(BlockMateScreenCaptureService.EXTRA_RESULT_CODE, result.resultCode)
          putExtra(BlockMateScreenCaptureService.EXTRA_RESULT_DATA, result.data)
        }
        ContextCompat.startForegroundService(context, startIntent)
        BlockMateScreenCaptureService.snapshot()
      }
    }

    AsyncFunction("getScreenCaptureStatus") {
      BlockMateScreenCaptureService.snapshot()
    }

    AsyncFunction("stopScreenCapture") {
      context.stopService(Intent(context, BlockMateScreenCaptureService::class.java))
      BlockMateScreenCaptureService.markStatus("screen_capture_stopped")
      BlockMateScreenCaptureService.snapshot()
    }
  }

  private fun requireService(): BlockMateAccessibilityService {
    return BlockMateAccessibilityService.instance
      ?: throw IllegalStateException("Enable BlockMate Minecraft controls in Android Accessibility settings first")
  }
}

private data class ScreenCaptureResult(val resultCode: Int, val data: Intent?)

private class ScreenCaptureContract : AppContextActivityResultContract<String, ScreenCaptureResult> {
  override fun createIntent(context: Context, input: String): Intent {
    val manager = context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
    return manager.createScreenCaptureIntent()
  }

  override fun parseResult(input: String, resultCode: Int, intent: Intent?): ScreenCaptureResult {
    return ScreenCaptureResult(resultCode, intent)
  }
}
