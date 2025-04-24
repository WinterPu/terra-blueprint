// This is defined string used in mustache template
export const AGORA_MUSTACHE_DATA = {
  AGORA_DATA: 'AgoraData',
  CREATE_RAW_DATA: 'CreateRawData',
  FREE_RAW_DATA: 'FreeRawData',

  // TBD(WinterPu) use inline function to replace macro functions
  NEW_RAW_ARRAY_DATA: 'UABT::New_CustomRawDataArray',
  FREE_RAW_ARRAY_DATA: 'UABT::Free_CustomRawDataArray',
  SET_BP_ARRAY_DATA: 'UABT::SetBPDataArray',
  SET_BP_FSTRING_TARRAY: 'UABT::SetBPFStringTArray',

  // NEW_RAW_ARRAY_DATA: 'UABT_NEW_RAW_DATA_ARRAY',
  // FREE_RAW_ARRAY_DATA: 'UABT_FREE_RAW_DATA_ARRAY',
  // SET_BP_ARRAY_DATA: 'UABT_SET_TARRAY_DATA',

  CREATE_RAW_OPT_DATA: 'CreateRawOptData',
  FREE_RAW_OPT_DATA: 'FreeRawOptData',

  UEBP_PREFIX_CLASS: 'UAgoraBPu',
  UEBP_PREFIX_STRUCT: 'FUABT_',
  UEBP_PREFIX_ENUM: 'EUABT_',
  FUABT_OPT_PREFIX: 'FUABT_Opt_',

  UEBP_: 'UEBP_', // param conv ue prefix
  RAW_: 'Raw_', // param conv raw prefix
  RETURN_VAL: 'ret',
  RETURN_VAL_DECL: 'ReturnVal', // return type conv prefix
  FINAL_RETURN_RESULT: 'FinalReturnResult',

  UABTEnum_WrapWithUE: 'UABTEnum::WrapWithUE',
  UABTEnum_ToRawValue: 'UABTEnum::ToRawValue',

  BPFileName_Prefix: 'AgoraBPu',

  // Conv Func
  ConvFunc_New_RawDataPtr1D: 'UABT::New_RawDataPtr1D',
  ConvFunc_Free_RawDataPtr1D: 'UABT::Free_RawDataPtr1D',

  ConvFunc_New_CustomRawDataPtr1D: 'UABT::New_CustomRawDataPtr1D',
  ConvFunc_Free_CustomRawDataPtr1D: 'UABT::Free_CustomRawDataPtr1D',

  ConvFunc_Set_BPDataArray: 'UABT::SetBPDataArray',
  ConvFunc_Set_RawDataArray: 'UABT::SetRawDataArray',

  ConvFunc_New_CustomRawDataArray: 'UABT::New_CustomRawDataArray',
  ConvFunc_Free_CustomRawDataArray: 'UABT::Free_CustomRawDataArray',
};
