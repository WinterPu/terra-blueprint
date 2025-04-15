// key: cpp file name 
// value: bp file name
export const map_includefiles: { [key: string]: string[] } = {
  'AgoraBase.h': [''],

  'AgoraMediaBase.h': ['#include "AgoraBPuAgoraBase.h"'],


  // TBD(WinterPu)
  // because we use: [MergeNodeParser]
  // it only merge the clazz, but left observer and structs.
  // for now, we override the header file to include them.
  'IAgoraRtcEngine.h': [
    '#include "AgoraBPuAgoraBase.h"',
    '#include "AgoraBPuAgoraMediaBase.h"',
    '#include "AgoraBPuAgoraLog.h"',
    '#include "AgoraBPuAudioDeviceManager.h"',
    '#include "AgoraBPuAgoraRhythmPlayer.h"',
    '#include "AgoraBPuAgoraMediaEngine.h"',
    '#include "AgoraBPuAgoraH265Transcoder.h"',
    '#include "AgoraBPuAgoraRtcEngineEx.h"',
  ],

  'IAgoraRtcEngineEx.h': [],
};
