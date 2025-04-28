export type ClazzMethodReplacedContext_ = {
  doReplceDecl: boolean;
  decl: string;
  doReplceImpl: boolean;
  impl: string;
};

export const map_clazz_method_replaced_context: {
  [key: string]: ClazzMethodReplacedContext_;
} = {
  'agora::rtc::IMediaPlayer.setPlayerOptionInInt': {
    doReplceDecl: false,
    decl: ``,
    doReplceImpl: true,
    impl: `
int UAgoraBPuMediaPlayer::SetPlayerOptionInInt(const FString & key, int value)
  {
      // Need to be optimized
      int FinalReturnResult = AGORA_UE_ERR_CODE(ERROR_NULLPTR);




      // Convert UEBP to CppType
      std::string Raw_key = TCHAR_TO_UTF8(*key);
      int Raw_value = value;

      // Call Native Method
      
      // REPLACE_REPLACE!!!
      auto ret = _NativePtr->setPlayerOption(Raw_key.c_str(), Raw_value);

      // Free Data if neeeded
      

      int ReturnVal = ret;
      FinalReturnResult =  ReturnVal;

      // Need to be optimized
      return FinalReturnResult;

  }
        `,
  },

  'agora::rtc::IMediaPlayer.setPlayerOptionInString': {
    doReplceDecl: false,
    decl: ``,
    doReplceImpl: true,
    impl: `
    int UAgoraBPuMediaPlayer::SetPlayerOptionInString(const FString & key, const FString & value)
          {
      // Need to be optimized
      int FinalReturnResult = AGORA_UE_ERR_CODE(ERROR_NULLPTR);

      // Convert UEBP to CppType
      std::string Raw_key = TCHAR_TO_UTF8(*key);
      std::string Raw_value = TCHAR_TO_UTF8(*value);

      // Call Native Method
      
      auto ret = _NativePtr->setPlayerOption(Raw_key.c_str(), Raw_value.c_str());

// Free Data if neeeded
      

      int ReturnVal = ret;
      FinalReturnResult =  ReturnVal;

      // Need to be optimized
      return FinalReturnResult;
        
          }
                `,
  },

  'agora::rtc::IMusicPlayer.openWithSongCode': {
    doReplceDecl: false,
    decl: ``,
    doReplceImpl: true,
    impl: `
  int UAgoraBPuMusicPlayer::OpenWithSongCode(int64 songCode, int64 startPos)
  {
      // Need to be optimized
      int FinalReturnResult = AGORA_UE_ERR_CODE(ERROR_NULLPTR);




      // Convert UEBP to CppType
      int64_t Raw_songCode = songCode;
      int64_t Raw_startPos = startPos;

      // Call Native Method
      
      auto ret = _NativePtr->open(Raw_songCode, Raw_startPos);

      // Free Data if neeeded
      

      int ReturnVal = ret;
      FinalReturnResult =  ReturnVal;


      // Need to be optimized
      return FinalReturnResult;

  }
                `,
  },
};
