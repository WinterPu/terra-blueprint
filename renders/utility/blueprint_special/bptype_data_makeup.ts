// TBD(WinterPu)
// 1. add additional_postcontent for method
// Ex. blueprint pure function

export type ClazzAddtionalContext_ = {
  NativePtr: string;
  Inst: string;
  InitDecl: string;
  InitImpl: string;
};

export const map_class_initialization: {
  [key: string]: ClazzAddtionalContext_;
} = {
  // Item: {
  //   NativePtr: ``, // In Called Function
  //   Inst: `
  //   `,
  //   InitDecl: `
  //   `,
  //   InitImpl: `
  //   `,
  // },

  // UE 425 - UPROPERTY() cannot be static
  IRtcEngine: {
    NativePtr: `AgoraUERtcEngine::Get()`,
    Inst: `
        `,
    InitDecl: `
        `,
    InitImpl: `
        `,
  },
  IAudioDeviceManager: {
    NativePtr: `_NativePtr`,
    Inst: `
      static UAgoraBPuAudioDeviceManager* InsAudioDeviceManager = nullptr;
      
      agora::rtc::IAudioDeviceManager* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IAudioDeviceManager")
      static UAgoraBPuAudioDeviceManager* GetAgoraAudioDeviceManager();
      `,
    InitImpl: `
      UAgoraBPuAudioDeviceManager* UAgoraBPuAudioDeviceManager::GetAgoraAudioDeviceManager(){
        if (InsAudioDeviceManager == nullptr)
        {
          InsAudioDeviceManager = NewObject<UAgoraBPuAudioDeviceManager>();
          InsAudioDeviceManager->AddToRoot();
          AgoraUERtcEngine::Get()->queryInterface(agora::rtc::AGORA_IID_AUDIO_DEVICE_MANAGER, (void**)&InsAudioDeviceManager->_NativePtr);
  
          if(InsAudioDeviceManager->_NativePtr == nullptr){
          
            UAgoraBPuLogger::PrintError("AudioDeviceManager is nullptr." + AGORA_UEBP_ERR_STR[AGORA_UE_ERROR_CODE::ERROR_BP_RTC_ENGINE_NOT_INITIALIZED]);
  
          }
  
          InsAudioDeviceManager->PlaybackDeviceCollection = NewObject<UAudioDeviceCollection>();
  
          InsAudioDeviceManager->RecordDeviceCollection = NewObject<UAudioDeviceCollection>();
        }
        return InsAudioDeviceManager;
      }
      `,
  },

  IVideoDeviceManager: {
    NativePtr: `_NativePtr`,
    Inst: `
      static UAgoraBPuVideoDeviceManager* InsVideoDeviceManager = nullptr;
      
      agora::rtc::IVideoDeviceManager* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IVideoDeviceManager")
      static UAgoraBPuVideoDeviceManager* GetAgoraVideoDeviceManager();
      `,
    InitImpl: `
      UAgoraBPuVideoDeviceManager* UAgoraBPuVideoDeviceManager::GetAgoraVideoDeviceManager()
      {
        if (InsVideoDeviceManager == nullptr)
        {
          InsVideoDeviceManager = NewObject<UAgoraBPuVideoDeviceManager>();
          InsVideoDeviceManager->AddToRoot();
          AgoraUERtcEngine::Get()->queryInterface(agora::rtc::AGORA_IID_VIDEO_DEVICE_MANAGER, (void**)&InsVideoDeviceManager->_NativePtr);
  
          if (InsVideoDeviceManager->_NativePtr == nullptr) {
  
            UAgoraBPuLogger::PrintError("VideoDeviceManager is nullptr." + AGORA_UEBP_ERR_STR[AGORA_UE_ERROR_CODE::ERROR_BP_RTC_ENGINE_NOT_INITIALIZED]);
  
            InsVideoDeviceManager->VideoDeviceCollection = nullptr;
          }
          else{
          
            InsVideoDeviceManager->VideoDeviceCollection = NewObject<UVideoDeviceCollection>();
          
          }
        }
        return Instance;
      }
  `,
  },

  IMediaPlayer: {
    NativePtr: `_NativePtr`,
    Inst: `
      static UAgoraBPuMediaPlayer* InsMediaPlayer = nullptr;
      
      agora::rtc::IMediaPlayer* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IMediaPlayer")
      static UAgoraBPuMediaPlayer* GetAgoraMediaPlayer();
      `,
    InitImpl: `
      UAgoraBPuMediaPlayer* UAgoraBPuMediaPlayer::GetAgoraMediaPlayer()
      {
        if (InsMediaPlayer == nullptr)
        {
          InsMediaPlayer = NewObject<UAgoraBPuMediaPlayer>();
          InsMediaPlayer->AddToRoot();
          // TBD(WinterPu)
        }
        return InsMediaPlayer;
      }
      `,
  },
  IMediaRecorder: {
    NativePtr: `_NativePtr`,
    Inst: `
      static UAgoraBPuMediaRecorder* InsMediaRecorder = nullptr;
      
      agora::rtc::IMediaRecorder* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IMediaRecorder")
      static UAgoraBPuMediaRecorder* GetAgoraMediaRecorder();
      `,
    InitImpl: `
      UAgoraBPuMediaRecorder* UAgoraBPuMediaRecorder::GetAgoraMediaRecorder()
      {
        if (InsMediaRecorder == nullptr)
        {
          InsMediaRecorder = NewObject<UAgoraBPuMediaRecorder>();
          InsMediaRecorder->AddToRoot();
          // TBD(WinterPu)
        }
        return InsMediaRecorder;
      }
      `,
  },
  IMediaStreamingSource: {
    NativePtr: `_NativePtr`,
    Inst: `
      static UAgoraBPuMediaStreamingSource* InsMediaStreamingSource = nullptr;
      
      agora::rtc::IMediaStreamingSource* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IMediaStreamingSource")
      static UAgoraBPuMediaStreamingSource* GetAgoraMediaStreamingSource();
      `,
    InitImpl: `
      UAgoraBPuMediaStreamingSource* UAgoraBPuMediaStreamingSource::GetAgoraMediaStreamingSource()
      {
        if (InsMediaStreamingSource == nullptr)
        {
          InsMediaStreamingSource = NewObject<UAgoraBPuMediaStreamingSource>();
          InsMediaStreamingSource->AddToRoot();
          // TBD(WinterPu)
        }
        return InsMediaStreamingSource;
      }
      `,
  },
  IMediaEngine: {
    NativePtr: `_NativePtr`,
    Inst: `
      static UAgoraBPuMediaEngine* InsMediaEngine = nullptr;
      
      agora::media::IMediaEngine* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IMediaEngine")
      static UAgoraBPuMediaEngine* GetAgoraMediaEngine();
      `,
    InitImpl: `
      UAgoraBPuMediaEngine* UAgoraBPuMediaEngine::GetAgoraMediaEngine()
      {
        if (InsMediaEngine == nullptr)
        {
          InsMediaEngine = NewObject<UAgoraBPuMediaEngine>();
          InsMediaEngine->AddToRoot();
          // TBD(WinterPu)
        }
        return InsMediaEngine;
      }
      `,
  },
  IMediaPlayerSource: {
    NativePtr: `_NativePtr`,
    Inst: `
      static UAgoraBPuMediaPlayerSource* InsMediaPlayerSource = nullptr;
      
      agora::rtc::IMediaPlayerSource* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IMediaPlayerSource")
      static UAgoraBPuMediaPlayerSource* GetAgoraMediaPlayerSource();
      `,
    InitImpl: `
      UAgoraBPuMediaPlayerSource* UAgoraBPuMediaPlayerSource::GetAgoraMediaPlayerSource()
      {
        if (InsMediaPlayerSource == nullptr)
        {
          InsMediaPlayerSource = NewObject<UAgoraBPuMediaPlayerSource>();
          InsMediaPlayerSource->AddToRoot();
          // TBD(WinterPu)
        }
        return InsMediaPlayerSource;
      }
      `,
  },
  ILocalSpatialAudioEngine: {
    NativePtr: `_NativePtr`,
    Inst: `
      static UAgoraBPuLocalSpatialAudioEngine* InsLocalSpatialAudioEngine = nullptr;
      
      agora::rtc::ILocalSpatialAudioEngine* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|ILocalSpatialAudioEngine")
      static UAgoraBPuLocalSpatialAudioEngine* GetAgoraLocalSpatialAudioEngine();
      `,
    InitImpl: `
      UAgoraBPuLocalSpatialAudioEngine* UAgoraBPuLocalSpatialAudioEngine::GetAgoraLocalSpatialAudioEngine()
      {
        if (InsLocalSpatialAudioEngine == nullptr)
        {
          InsLocalSpatialAudioEngine = NewObject<UAgoraBPuLocalSpatialAudioEngine>();
          InsLocalSpatialAudioEngine->AddToRoot();
          // TBD(WinterPu)
        }
        return InsLocalSpatialAudioEngine;
      }
      `,
  },
  MusicChartCollection: {
    NativePtr: `_NativePtr`,
    Inst: `
      static UAgoraBPuMusicChartCollection* InsMusicChartCollection = nullptr;
      
      agora::rtc::IMusicChartCollection* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IMusicChartCollection")
      static UAgoraBPuMusicChartCollection* GetAgoraMusicChartCollection();
      `,
    InitImpl: `
      UAgoraBPuMusicChartCollection* UAgoraBPuMusicChartCollection::GetAgoraMusicChartCollection()
      {
        if (InsMusicChartCollection == nullptr)
        {
          InsMusicChartCollection = NewObject<UAgoraBPuMusicChartCollection>();
          InsMusicChartCollection->AddToRoot();
          // TBD(WinterPu)
        }
        return InsMusicChartCollection;
      }
      `,
  },
  IH265Transcoder: {
    NativePtr: `_NativePtr`,
    Inst: `
      static UAgoraBPuH265Transcoder* InsH265Transcoder = nullptr;
      
      agora::rtc::IH265Transcoder* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IH265Transcoder")
      static UAgoraBPuH265Transcoder* GetAgoraH265Transcoder();
      `,
    InitImpl: `
      UAgoraBPuH265Transcoder* UAgoraBPuH265Transcoder::GetAgoraH265Transcoder()
      {
        if (InsH265Transcoder == nullptr)
        {
          InsH265Transcoder = NewObject<UAgoraBPuH265Transcoder>();
          InsH265Transcoder->AddToRoot();
          // TBD(WinterPu)
        }
        return InsH265Transcoder;
      }
      `,
  },
  IMediaRecorderObserver: {
    NativePtr: `_NativePtr`,
    Inst: `
      static UAgoraBPuMediaRecorderObserver* InsMediaRecorderObserver = nullptr;
      
      agora::media::IMediaRecorderObserver* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IMediaRecorderObserver")
      static UAgoraBPuMediaRecorderObserver* GetAgoraMediaRecorderObserver();
      `,
    InitImpl: `
      UAgoraBPuMediaRecorderObserver* UAgoraBPuMediaRecorderObserver::GetAgoraMediaRecorderObserver()
      {
        if (InsMediaRecorderObserver == nullptr)
        {
          InsMediaRecorderObserver = NewObject<UAgoraBPuMediaRecorderObserver>();
          InsMediaRecorderObserver->AddToRoot();
          // TBD(WinterPu)
        }
        return InsMediaRecorderObserver;
      }
      `,
  },
  IMediaPlayerSourceObserver: {
    NativePtr: `_NativePtr`,
    Inst: `
      static UAgoraBPuMediaPlayerSourceObserver* InsMediaPlayerSourceObserver = nullptr;
      
      agora::rtc::IMediaPlayerSourceObserver* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IMediaPlayerSourceObserver")
      static UAgoraBPuMediaPlayerSourceObserver* GetAgoraMediaPlayerSourceObserver();
      `,
    InitImpl: `
      UAgoraBPuMediaPlayerSourceObserver* UAgoraBPuMediaPlayerSourceObserver::GetAgoraMediaPlayerSourceObserver()
      {
        if (InsMediaPlayerSourceObserver == nullptr)
        {
          InsMediaPlayerSourceObserver = NewObject<UAgoraBPuMediaPlayerSourceObserver>();
          InsMediaPlayerSourceObserver->AddToRoot();
          // TBD(WinterPu)
        }
        return InsMediaPlayerSourceObserver;
      }
      `,
  },
  IH265TranscoderObserver: {
    NativePtr: `_NativePtr`,
    Inst: `
      static UAgoraBPuH265TranscoderObserver* InsH265TranscoderObserver = nullptr;
      
      agora::rtc::IH265TranscoderObserver* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IH265TranscoderObserver")
      static UAgoraBPuH265TranscoderObserver* GetAgoraH265TranscoderObserver();
      `,
    InitImpl: `
      UAgoraBPuH265TranscoderObserver* UAgoraBPuH265TranscoderObserver::GetAgoraH265TranscoderObserver()
      {
        if (InsH265TranscoderObserver == nullptr)
        {
          InsH265TranscoderObserver = NewObject<UAgoraBPuH265TranscoderObserver>();
          InsH265TranscoderObserver->AddToRoot();
          // TBD(WinterPu)
        }
        return InsH265TranscoderObserver;
      }
      `,
  },
  IVideoFrameMetaInfo: {
    NativePtr: `VideoFrameMetaInfoInstance`,
    Inst: `
      static UAgoraBPuVideoFrameMetaInfo* InsVideoFrameMetaInfo = nullptr;
      
      agora::media::base::IVideoFrameMetaInfo* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IVideoFrameMetaInfo")
      static UAgoraBPuVideoFrameMetaInfo* GetAgoraVideoFrameMetaInfo();
      `,
    InitImpl: `
      UAgoraBPuVideoFrameMetaInfo* UAgoraBPuVideoFrameMetaInfo::GetAgoraVideoFrameMetaInfo()
      {
        if (InsVideoFrameMetaInfo == nullptr)
        {
          InsVideoFrameMetaInfo = NewObject<UAgoraBPuVideoFrameMetaInfo>();
          InsVideoFrameMetaInfo->AddToRoot();
          // TBD(WinterPu)
        }
        return InsVideoFrameMetaInfo;
      }
      `,
  },
  IMediaPlayerCacheManager: {
    NativePtr: `_NativePtr`,
    Inst: `
      static UAgoraBPuMediaPlayerCacheManager* InsMediaPlayerCacheManager = nullptr;
      
      agora::rtc::IMediaPlayerCacheManager* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IMediaPlayerCacheManager")
      static UAgoraBPuMediaPlayerCacheManager* GetAgoraMediaPlayerCacheManager();
      `,
    InitImpl: `
      UAgoraBPuMediaPlayerCacheManager* UAgoraBPuMediaPlayerCacheManager::GetAgoraMediaPlayerCacheManager()
      {
        if (InsMediaPlayerCacheManager == nullptr)
        {
          InsMediaPlayerCacheManager = NewObject<UAgoraBPuMediaPlayerCacheManager>();
          InsMediaPlayerCacheManager->AddToRoot();
          // TBD(WinterPu)
        }
        return InsMediaPlayerCacheManager;
      }
      `,
  },
  MusicCollection: {
    NativePtr: `_NativePtr`,
    Inst: `
      static UAgoraBPuMusicCollection* InsMusicCollection = nullptr;
      
      agora::rtc::MusicCollection* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IMusicCollection")
      static UAgoraBPuMusicCollection* GetAgoraMusicCollection();
      `,
    InitImpl: `
      UAgoraBPuMusicCollection* UAgoraBPuMusicCollection::GetAgoraMusicCollection()
      {
        if (InsMusicCollection == nullptr)
        {
          InsMusicCollection = NewObject<UAgoraBPuMusicCollection>();
          InsMusicCollection->AddToRoot();
          // TBD(WinterPu)
        }
        return InsMusicCollection;
      }
      `,
  },
  IMusicContentCenter: {
    NativePtr: `_NativePtr`,
    Inst: `
      static UAgoraBPuMusicContentCenter* InsMusicContentCenter = nullptr;
      
      agora::rtc::IMusicContentCenter* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IMusicContentCenter")
      static UAgoraBPuMusicContentCenter* GetAgoraMusicContentCenter();
      `,
    InitImpl: `
      UAgoraBPuMusicContentCenter* UAgoraBPuMusicContentCenter::GetAgoraMusicContentCenter()
      {
        if (InsMusicContentCenter == nullptr)
        {
          InsMusicContentCenter = NewObject<UAgoraBPuMusicContentCenter>();
          InsMusicContentCenter->AddToRoot();
          // TBD(WinterPu)
        }
        return InsMusicContentCenter;
      }
      `,
  },

  IMusicPlayer: {
    NativePtr: `_NativePtr`, // In Called Function
    Inst: `
      static UAgoraBPuMusicPlayer* InsMusicPlayer = nullptr;
      
      agora::rtc::IMusicPlayer* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IMusicPlayer")
      static UAgoraBPuMusicPlayer* GetAgoraMusicPlayer();
      `,
    InitImpl: `
      UAgoraBPuMusicPlayer* UAgoraBPuMusicPlayer::GetAgoraMusicPlayer()
      {
        if (InsMusicPlayer == nullptr)
        {
          InsMusicPlayer = NewObject<UAgoraBPuMusicPlayer>();
          InsMusicPlayer->AddToRoot();
          // TBD(WinterPu)
        }
        return InsMusicPlayer;
      }
      `,
  },
  IScreenCaptureSourceList: {
    NativePtr: `_NativePtr`,
    Inst: `
      static UAgoraBPuScreenCaptureSourceList* InsScreenCaptureSourceList = nullptr;
      
      agora::rtc::IScreenCaptureSourceList* _NativePtr = nullptr;
      `,
    InitDecl: `
      UFUNCTION(BlueprintCallable,Category = "Agora|IScreenCaptureSourceList")
      static UAgoraBPuScreenCaptureSourceList* GetAgoraScreenCaptureSourceList();
      `,
    InitImpl: `
      UAgoraBPuScreenCaptureSourceList* UAgoraBPuScreenCaptureSourceList::GetAgoraScreenCaptureSourceList()
      {
        if (InsScreenCaptureSourceList == nullptr)
        {
          InsScreenCaptureSourceList = NewObject<UAgoraBPuScreenCaptureSourceList>();
          InsScreenCaptureSourceList->AddToRoot();
          // TBD(WinterPu)
        }
        return InsScreenCaptureSourceList;
      }
      `,
  },
  // MusicChartCollection: {
  //   Inst: `
  //   UPROPERTY()
  //   static UAgoraBPuVideoDeviceManager* MusicChartCollection
  //   `,
  //   InitDecl: `
  //   UFUNCTION(BlueprintCallable,Category = "Agora|IVideoDeviceManager")
  //   static UAgoraBPuVideoDeviceManager* GetAgoraVideoDeviceManager();
  //   `,
  //   InitImpl: `

  //   `,
  // },

  // MusicCollection: {},
};
