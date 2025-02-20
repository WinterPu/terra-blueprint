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

  'unsigned short': 'int',
  'unsigned int': 'int64',

  // not builtin type
  'uint8_t': 'Byte',
  'int32_t': 'int',
  'uint32_t': 'int64',
  'int64_t': 'int64',
  'uint64_t': 'FString',

  'agora::rtc::uid_t': 'int64',

  'long long': 'int64',

  // [TBD] some types that may have issues"
  'size_t': 'int64',
  'void*': 'void*',

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

// type convert functions

// [key]: still use cpp type
export const map_bp2cpp_convert_function_name: { [key: string]: string } = {
  double: 'UABT::ToDouble',

  uid_t: 'UABT::ToUID',
  uint32_t: 'UABT::ToUInt32',
  track_id_t: 'UABT::ToVTID',
  view_t: 'UABT::ToView',
};

export const map_cpp2bp_convert_function_name: { [key: string]: string } = {
  'view_t': 'UABT::FromViewToInt',
  'double': 'UABT::FromDouble',
  'const char*': 'UTF8_TO_TCHAR',
  'char const*': 'UTF8_TO_TCHAR',
  // array
  'float*': 'UABT::FromFloatArray',
};

export const map_bp2cpp_memory_handle: { [key: string]: [string, string] } = {
  // FString
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

export const map_native_ptr_name: { [key: string]: string } = {
  IRtcEngine: 'AgoraUERtcEngine::Get()',
  IMediaPlayer: 'MediaPlayerInstance',
  IAudioDeviceManager: 'AudioDeviceManagerInstance',
  IMediaRecorder: 'MediaRecorderInstance',
  IMediaStreamingSource: 'MediaStreamingSourceInstance',
  IMediaEngine: 'MediaEngineInstance',
  IMediaPlayerSource: 'MediaPlayerSourceInstance',
  ILocalSpatialAudioEngine: 'LocalSpatialAudioEngineInstance',
  MusicChartCollection: 'MusicChartCollectionInstance',
  IH265Transcoder: 'H265TranscoderInstance',
  IMediaRecorderObserver: 'MediaRecorderObserverInstance',
  IMediaPlayerObserver: 'MediaPlayerObserverInstance',
  IMediaPlayerSourceObserver: 'MediaPlayerSourceObserverInstance',
  ILocalSpatialAudioEngineObserver: 'LocalSpatialAudioEngineObserverInstance',
  IH265TranscoderObserver: 'H265TranscoderObserverInstance',
  IVideoFrameMetaInfo: 'VideoFrameMetaInfoInstance',
};

// TBD(WinterPu)
// 1. const FString & or FString

// TBD(WinterPu)
// 1. When bp to cpp raw: FString => std::string / not: const char *
// 2. const char * => FString

// For declaration type
export const map_decltype_bp2cpp: { [key: string]: string } = {
  FString: 'std::string',
};
