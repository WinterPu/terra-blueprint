import { ClazzMethodReplacedContext_, rc_empty_data } from '../helper';

export const map_data: {
  [key: string]: ClazzMethodReplacedContext_;
} = {
  'agora::rtc::IRtcEngine.getScreenCaptureSources': {
    ...rc_empty_data,
    doReplceDecl: false,
    decl: ``,
    doReplceImpl: true,
    impl: `
        UAgoraBPuScreenCaptureSourceList * UAgoraBPuRtcEngine::GetScreenCaptureSources(const FUABT_SIZE & thumbSize, const FUABT_SIZE & iconSize, const bool & includeScreen)
    {
        // Need to be optimized
        UAgoraBPuScreenCaptureSourceList * FinalReturnResult = nullptr;
  
  
  // #if defined(_WIN32) || (defined(__APPLE__) && TARGET_OS_MAC && !TARGET_OS_IPHONE)
  
  //       // Convert UEBP to CppType
  //       agora::rtc::SIZE Raw_thumbSize = thumbSize.CreateRawData();
  
  //       agora::rtc::SIZE Raw_iconSize = iconSize.CreateRawData();
  
  //       bool Raw_includeScreen = includeScreen;
  
  //       // Call Native Method
        
  //       auto ret = AgoraUERtcEngine::Get()->getScreenCaptureSources(Raw_thumbSize, Raw_iconSize, Raw_includeScreen);
  
  // // Free Data if neeeded
  //       thumbSize.FreeRawData(Raw_thumbSize);
  
  //       iconSize.FreeRawData(Raw_iconSize);
  
        
  
  
  //       UAgoraBPuScreenCaptureSourceList * ReturnVal = ret;
  //       FinalReturnResult =  ReturnVal;
  
  
  
  // #endif
  
        // Need to be optimized
        return FinalReturnResult;
  
    }
      `,
  },
};
