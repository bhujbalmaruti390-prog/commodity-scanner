package com.legalmetrology.scanner

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.view.View
import android.webkit.*
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar

    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var cameraImageUri: Uri? = null

    // Fallback development URL or local asset
    // In Android Studio, you can change this URL to your live deployed server IP or Cloud Run domain
    private val defaultAppUrl: String = "https://legalmetrology.applet.run"

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            Toast.makeText(this, "Camera permission granted for label scanning", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "Camera permission is required for live label scanning", Toast.LENGTH_LONG).show()
        }
    }

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (fileUploadCallback == null) return@registerForActivityResult

        val results: Array<Uri>? = if (result.resultCode == RESULT_OK) {
            val data = result.data
            if (data?.data != null) {
                // Image selected from gallery
                arrayOf(data.data!!)
            } else if (cameraImageUri != null) {
                // Photo captured from camera
                arrayOf(cameraImageUri!!)
            } else {
                null
            }
        } else {
            null
        }

        fileUploadCallback?.onReceiveValue(results)
        fileUploadCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefresh = findViewById(R.id.swipeRefreshLayout)
        progressBar = findViewById(R.id.loadingProgress)

        checkCameraPermission()
        setupWebView()
        setupSwipeRefresh()
        setupBackNavigation()

        loadApplication()
    }

    private fun checkCameraPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED
        ) {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.setSupportZoom(true)
        settings.builtInZoomControls = true
        settings.displayZoomControls = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
                swipeRefresh.isRefreshing = false
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    progressBar.visibility = View.GONE
                    swipeRefresh.isRefreshing = false
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                progressBar.progress = newProgress
                if (newProgress == 100) {
                    progressBar.visibility = View.GONE
                }
            }

            // Grants WebRTC camera permission inside WebView for HTML5 <video> preview
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.let {
                    val requestedResources = it.resources
                    for (resource in requestedResources) {
                        if (resource == PermissionRequest.RESOURCE_VIDEO_CAPTURE ||
                            resource == PermissionRequest.RESOURCE_AUDIO_CAPTURE
                        ) {
                            it.grant(arrayOf(resource))
                            return
                        }
                    }
                    it.grant(requestedResources)
                }
            }

            // Handles standard HTML file picker and camera capture
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                openCameraOrGalleryChooser()
                return true
            }
        }
    }

    private fun openCameraOrGalleryChooser() {
        val takePictureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        try {
            val photoFile = createImageFile()
            cameraImageUri = FileProvider.getUriForFile(
                this,
                "${applicationContext.packageName}.fileprovider",
                photoFile
            )
            takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, cameraImageUri)
        } catch (ex: IOException) {
            cameraImageUri = null
        }

        val galleryIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "image/*"
        }

        val chooserIntent = Intent(Intent.ACTION_CHOOSER).apply {
            putExtra(Intent.EXTRA_INTENT, galleryIntent)
            putExtra(Intent.EXTRA_TITLE, "Select Packaging Image or Capture Photo")
            if (takePictureIntent.resolveActivity(packageManager) != null && cameraImageUri != null) {
                putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(takePictureIntent))
            }
        }

        fileChooserLauncher.launch(chooserIntent)
    }

    @Throws(IOException::class)
    private fun createImageFile(): File {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val imageFileName = "METROLOGY_SCAN_" + timeStamp + "_"
        val storageDir = cacheDir
        return File.createTempFile(imageFileName, ".jpg", storageDir)
    }

    private fun setupSwipeRefresh() {
        swipeRefresh.setColorSchemeColors(
            ContextCompat.getColor(this, R.color.accent)
        )
        swipeRefresh.setOnRefreshListener {
            webView.reload()
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    private fun loadApplication() {
        // Priority 1: Check if local built SPA assets exist in android assets folder
        try {
            val assetList = assets.list("dist")
            if (!assetList.isNullOrEmpty()) {
                webView.loadUrl("file:///android_asset/dist/index.html")
                return
            }
        } catch (e: Exception) {
            // Assets not found, fallback to live server url
        }

        // Priority 2: Load development URL or remote Cloud Run domain
        webView.loadUrl(defaultAppUrl)
    }
}
