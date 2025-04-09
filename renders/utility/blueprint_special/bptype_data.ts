// [TBD] if need namespace or not ？

// For parameters' type
// [Key] type.source namespace removed
export const map_cpptype_2_uebptype: { [key: string]: string } = {
  'void': 'void',
  'int': 'int',
  'float': 'float',
  'double': 'FString',
  'const char*': 'FString',
  'char const*': 'FString',
  'unsigned char const*': 'FString',
  'char*': 'FString',

  'unsigned short': 'int',
  'unsigned int': 'int64',

  // not builtin type
  'uint8_t': 'int', // TBD(WinterPu) should be Byte, however Byte may not be supported in UE4.25
  'int32_t': 'int',
  'uint32_t': 'int64',
  'int64_t': 'int64',
  'uint64_t': 'FString',
  'int16_t': 'int',
  'uint16_t': 'int',

  'agora::rtc::uid_t': 'int64',
  'agora::user_id_t': 'FString',
  'agora::view_t': 'int64', // TBD(WinterPu) store pointer address
  'base::user_id_t': 'FString',
  'rtc::uid_t': 'int64',
  'rtc::track_id_t': 'int64',
  'agora::rtc::track_id_t': 'int64',
  'agora::rtc::video_track_id_t': 'int64',
  'media::base::view_t': 'int64',
  'agora::util::AString&': 'FString',
  'unsigned char*': 'FString',
  'void*': 'int64', // TBD(WinterPu)
  'long': 'int64', // TBD(WinterPu) check it

  'long long': 'int64',

  // [TBD] some types that may have issues"
  'size_t': 'int64',

  'float const[3]': 'FVector',

  // ==== agora special =====

  // Optional
  'Optional<bool>': 'FUABT_Opt_bool',
  'Optional<agora::rtc::VIDEO_STREAM_TYPE>': 'FUABT_Opt_VIDEO_STREAM_TYPE',
  'Optional<double>': 'FUABT_Opt_double',
  'Optional<int>': 'FUABT_Opt_int',
  'Optional<agora::rtc::CAMERA_DIRECTION>': 'FUABT_Opt_CAMERA_DIRECTION',
  'Optional<agora::rtc::CAMERA_FOCAL_LENGTH_TYPE>':
    'FUABT_Opt_CAMERA_FOCAL_LENGTH_TYPE',
  'Optional<const char *>': 'FUABT_Opt_ConstCharPtr',
  'Optional<agora::rtc::CLIENT_ROLE_TYPE>': 'FUABT_Opt_CLIENT_ROLE_TYPE',
  'Optional<agora::rtc::AUDIENCE_LATENCY_LEVEL_TYPE>':
    'FUABT_Opt_AUDIENCE_LATENCY_LEVEL_TYPE',
  'Optional<agora::CHANNEL_PROFILE_TYPE>': 'FUABT_Opt_CHANNEL_PROFILE_TYPE',
  'Optional<agora::rtc::video_track_id_t>': 'FUABT_Opt_video_track_id_t',
  'Optional<agora::rtc::THREAD_PRIORITY_TYPE>':
    'FUABT_Opt_THREAD_PRIORITY_TYPE',
};

export const regex_cpptype_2_uebptype_blacklist = new Map<RegExp, string>([
  [/(?:const\s+)?char\s*(?:const\s*)?\[\s*\d+\s*\]/g, 'FString'], // char const[n]
]);

// type convert functions

// TBD(WinterPu)
// 1. int64 => agora::rtc::uid_t

export const map_cpp2bp_convert_function_name: { [key: string]: string } = {
  'view_t': 'UABT::FromViewToInt',
  'double': 'UABT::FromDouble',
  'const char*': 'UTF8_TO_TCHAR',
  'char const*': 'UTF8_TO_TCHAR',
  // array
  'float*': 'UABT::FromFloatArray',
};

// [key]: still use cpp type
export const map_bp2cpp_convert_function_name: { [key: string]: string } = {
  double: 'UABT::ToDouble',

  uid_t: 'UABT::ToUID',
  uint32_t: 'UABT::ToUInt32',
  track_id_t: 'UABT::ToVTID',
  view_t: 'UABT::ToView',
};

export const map_bp2cpp_memory_handle: { [key: string]: [string, string] } = {
  // FString
  'const char*': ['UABT::New_ConstCharPtr', 'UABT::Free_ConstCharPtr'],
  'char const*': ['UABT::New_ConstCharPtr', 'UABT::Free_ConstCharPtr'],
  'char*': ['UABT::New_CharPtr', 'UABT::Free_CharPtr'],
  'unsigned char*': ['UABT::New_UnsignedCharPtr', 'UABT::Free_UnsignedCharPtr'],
  'char**': ['UABT::New_CharArrayPtr', 'UABT::Free_CharArrayPtr'],
  'uid_t*': ['UABT::New_UIDArrayPtr', 'UABT::Free_UIDArrayPtr'],

  'generic': ['UABT::New_RawData', 'UABT::Free_RawData'],
  'genericArray': ['UABT::New_RawDataArray', 'UABT::Free_RawDataArray'],
};

export const map_setdata_function_name: { [key: string]: string } = {
  //[TBD] need to add flag to judge if it needs to use set data

  //example:
  // UABT::SetCharArrayPtr(AgoraData.userAccount, this->userAccount, agora::rtc::MAX_USER_ACCOUNT_LENGTH);
  // No need to free memory
  'char*': 'UABT::SetCharArrayPtr',
};

export const map_cpptype_default_value: { [key: string]: string } = {
  'int': '0',
  'float': '0.0',
  'double': '0.0',
  'const char*': '""',
  'char const*': '""',
  'bool': 'false',

  'unsigned short': '0',
  'unsigned int': '0',

  'uint8_t': '0',
  'int32_t': '0',
  'uint32_t': '0',
  'int64_t': '0',
  'uint64_t': '0',
  'uid_t': '0',

  'long long': '0',

  'size_t': '0',
  'void*': 'nullptr',

  'unsigned char const*': '""',

  // ==== agora special =====
};

// TBD(WinterPu)
// 1. const FString & or FString

// TBD(WinterPu)
// 1. When bp to cpp raw: FString => std::string / not: const char *
// 2. const char * => FString

export enum SpecialDeclTypeRule {
  RULE_STR_BP2CPP = 'SPECIAL_DECL_TYPE_RULE_string_bp2cpp', // const char* => std::string
  RULE_STR_CPP2BP = 'SPECIAL_DECL_TYPE_RULE_string_cpp2bp', // std::string => const char*

  RULE_FVECTOR_BP2CPP = 'SPECIAL_DECL_TYPE_RULE_string_bp2cpp_fvector', // float const[3] => FVector
  RULE_FVECTOR_CPP2BP = 'SPECIAL_DECL_TYPE_RULE_string_cpp2bp_fvector', // FVector => float const[3]
}

// For declaration type
export const map_convdecltype_bp2cpp: { [key: string]: string } = {
  'const char*': SpecialDeclTypeRule.RULE_STR_BP2CPP,
  'char const*': SpecialDeclTypeRule.RULE_STR_BP2CPP,

  'float const[3]': SpecialDeclTypeRule.RULE_FVECTOR_BP2CPP,
};

// key: type source
export const map_convdecltype_cpp2bp: { [key: string]: string } = {
  'const char*': SpecialDeclTypeRule.RULE_STR_CPP2BP,
  'char const*': SpecialDeclTypeRule.RULE_STR_CPP2BP,
  'float const[3]': SpecialDeclTypeRule.RULE_FVECTOR_CPP2BP,
};

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

///// ========== For Array Parsing ==========

// should exclude
export const map_parse_array_blacklist: { [key: string]: boolean } = {
  'unsigned char const*': true,
  'unsigned char*': true,
  'char const*': true, // const char* => const FString &
  'char*': true,
  'float const[3]': true, // float const[3] => FVector
};

export const regex_parse_array_blacklist: RegExp[] = [
  /(?:const\s+)?char\s*(?:const\s*)?\[\s*\d+\s*\]/g, // char const[n]
  // 可以添加更多规则
];

// should do conversion
// Here, the value should be: TArray<type> without ex. const qualifier
// they would be added in the latter process
export const map_parse_array_whitelist: { [key: string]: string } = {
  'int const*': 'TArray<int>',
  'char const**': 'TArray<FString>',
};

// Agora Special
// judge in lower case
export const not_parse_array_type_based_on_agora: string[] = [
  'observer',
  'eventhandler',
  'audiopcmframesink',
];

// TBD(WinterPu)
// Better to use: namespace.class.method
export const not_parse_array_type_for_return_type: string[] = [
  'agora::rtc::Music*',
  'agora::rtc::MusicChartInfo*',
  'agora::rtc::IScreenCaptureSourceList*',
];

export const keep_pointer_type_list: string[] = [
  'agora::rtc::IScreenCaptureSourceList*',
];

// be special to one case
export const map_struct_member_variable_default_value: {
  [key: string]: string;
} = {
  /*
   * (Recommended) 0: Standard bitrate mode.
   *
   * In this mode, the video bitrate is twice the base bitrate.
   */
  // const int STANDARD_BITRATE = 0;
  'agora::rtc::ScreenCaptureParameters.bitrate': '0',
  'agora::rtc::VideoEncoderConfiguration.bitrate': '0',
  /**
   * -1: (For future use) The default minimum bitrate.
   */
  // const int DEFAULT_MIN_BITRATE = -1;
  'agora::rtc::VideoEncoderConfiguration.minBitrate': '-1',

  'agora::rtc::ScreenCaptureParameters.contentHint':
    'EUABT_VIDEO_CONTENT_HINT::CONTENT_HINT_MOTION',
};

// In Struct, the corresponding size count variable to the target member variable
export const map_struct_member_variable_size_count: { [key: string]: string } =
  {
    'agora::rtc::FocalLengthInfagora::rtc::DownlinkNetworkInfo::PeerDownlinkInfo.peer_downlink_info':
      'total_received_video_count',

    'agora::rtc::ChannelMediaRelayConfiguration.destInfos': 'destCount',
  };
