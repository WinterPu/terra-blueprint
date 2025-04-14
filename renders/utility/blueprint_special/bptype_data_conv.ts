import { AGORA_MUSTACHE_DATA } from './bptype_mustache_data';

// [TBD] if need namespace or not ？

// TBD(WinterPu)
// Type conversion guide:
// Based on the type, you should know how to call and use it

// Difference between [TypeName], [DeclType] and [TypeSource]
// Ex.
// cpp type source: const char **
// [TypeName]: Ex. FString: used in the case: call class static method: FString::FromCStr()
//  or used in template type UABT::SetBPArrayData<FString, TArray<FString>(BPVar, CppArrayVar, CppArraySize);
// [DeclType]: Ex. TArray<FString>: used in the variable declaration: TArray<FString> MyArray; (usually in the function implementation)
// [TypeSource]: Ex. const TArray<FString> &: used in the function parameter: void MyFunc(const TArray<FString> &MyArray);

// Here: CppType to BPType
export type UEBPTypeConvData = {
  bpTypeName: string;
  bpDesignedDeclType: string | undefined;
  // skip the process, directly assigned the type source
  bpDesignedTypeSource: string | undefined;
  // whether the implementation is user provided. (not the native blueprint type)
  isCustomBPType: boolean;

  // [Step 1]: Basic Conversion: (Directly Type Conversion: Cpp <-> BP)
  // this mostly used in the USTRUCT conversion.
  // Ex. constructor(cpptype data){}
  // define the basic conversion way
  convFromCpp: CppBPConversionData;
  convToCpp: CppBPConversionData;

  // [Step 2]: Default Value
  // usually used in the USTRUCT member variable
  defaultValue: string | undefined;

  // [Step 3]: Parse Array
  // Black List: skip the parse process, not parsed as an array.
  parseArrayIsInBlackList: boolean;
  // White List: directly define the target array type.
  parseArrayDesignedType: string | undefined;

  // [Step 4]: Parse Pointer
  // Force Enable: the type would always be used as a pointer.
  // Ex. in TArray<T>, the UCLASS needs to be an pointer.
  parsePointerForceEnable: boolean;

  // [Step 5]: Return Type
  // directly define the target return type
  returnTypeDesignedType: string | undefined;
  // the default failed value, which could be used to return
  returnTypeFailedValue: string | undefined;

  // [Step 6]: Decl Type (Indirect Type Conversion: Cpp <-DeclType-> BP)
  // this mostly used in the UFUNCTION implementation
  // Ex. DeclType Raw_var = BPVar;
  // [Usage Reason comparing to Basic Conversion]:
  // 1. try to avoid (New / Free) operation
  // 2. When it has special usage way. Ex. need to call function stdstr.c_str();
  // In some cases, when you declare the type in the function body, you need to use other type as decl type.
  // Ex. const char* => FString, you could use std::string as decl type.
  // Here would define how the type is used in the function body.

  // Default: it would use Basic Conversion as default.
  // Ex
  // decl: CppType CppVar = BPVar;
  // usage: CppVar;
  // free: none
  declTypeSPRule: DeclTypeSPRule;

  // default:
  // [bp] -> TypeName or bpDesignedDeclType
  // [cpp] -> type name or cppDesignedDeclType
  cppDesignedDeclType: string | undefined;
};

export type CppBPConversionData = {
  convFuncType: ConversionWayType;
  convFunc: string;
  convFuncAdditional01: string; // Ex. free data conv function
  runtimedata?: any; // Ex. array size
};

export enum ConversionWayType {
  // no need conversion
  NoNeedConversion,

  // need call basic conversion method
  // Ex. A = ConvFunc(B);
  Basic,

  // [Part1]. BP = FuncFrom(Cpp);
  // need memory allocation
  // Ex. UABT::SetBPArrayData<CppType, BPType>(BPVar,CppArrayVar, CppArraySize);
  BPFromCpp_NewFreeArrayData,

  // BPVar = UTF8_TO_TCHAR(CppVar);
  BPFromCpp_FString,

  // [Part2]. Cpp = FuncTo(BP);
  // * need memory allocation
  // Ex. CppVar = UABT::New_ConvFunc(BPVar);
  // Ex. UABT::Free_ConvFunc(CppVar);
  CppFromBP_NewFreeData,
  // need memory allocation
  // UABT::New_RawDataArray<CppType,BPType>(CppArrayVar,CppSize,BPVar);
  // UABT::Free_RawDataArray<CppType,BPType>(CppArrayVar,CppSize);
  CppFromBP_NewFreeArrayData,
  // Directly Set Data
  // Ex. Convfunc_SetData(CppVar, BPVar, CppVarSize);
  CppFromBP_SetData,
  // need call conversion function
  // Example: CreateRawData()
  // Ex. CppVar = BPVar.CreateRawData();
  // Ex. BPVar.FreeRawData(CppVar);
  CppFromBP_NeedCallConvFunc,
  // ==== Custom Defined BP Var Only ====
  // * need memory allocation
  // Ex. CppVar = BPVar.CreateRawOptData();
  // Ex. BPVar.FreeRawOptData(CppVar);
  CppFromBP_CreateFreeOptData,
}

export enum DeclTypeSPRule {
  DefaultNoSP,
  // For String
  // CPPFromBP: Ex. const char* <= FString (decltype: std::string)
  // BPFromCPP: Ex. FString <= const char* (decltype: FString)
  SP_String,

  // For FVector
  // CPPFromBP: Ex. float const[3] <= FVector (decltype: float[3])
  // BPFromCPP: Ex. FVector <= float const[3] (decltype: FVector)
  SP_FVector,
}

export type DeclTypeFuncData = {
  funcDecl: (decl_var: string, param: string) => string;
  funcUsage: (decl_var: string) => string;
  funcFree: (bpTypeName?: string) => string;
};

export type DeclTypeItemData = {
  CppFromBP: DeclTypeFuncData;
  BPFromCpp: DeclTypeFuncData;
};

export const map_decltype_special_rule = new Map<
  DeclTypeSPRule,
  DeclTypeItemData
>([
  [
    DeclTypeSPRule.SP_String,
    {
      // decl: std::string CppVar = TCHAR_TO_UTF8(*BPVar);
      // usage: CppVar.c_str();
      // free: none
      CppFromBP: {
        funcDecl: (decl_var, param) =>
          `std::string ${decl_var} = UTF8_TO_TCHAR(*${param});`,

        funcUsage: (decl_var) => `${decl_var}.c_str();`,

        funcFree: () => '',
      },
      // decl: FString BPVar = UTF8_TO_TCHAR(CppVar);
      // usage: BPVar;
      // free: none
      BPFromCpp: {
        funcDecl: (decl_var, param) =>
          `FString ${decl_var} = UTF8_TO_TCHAR(${param});`,

        funcUsage: (decl_var) => `${decl_var};`,

        funcFree: () => '',
      },
    },
  ],

  [
    DeclTypeSPRule.SP_FVector,
    {
      // decl: float[3] CppVar; UABT::SetFloatArray(BPVar, CppVar);
      // usage: CppVar;
      // free: none
      CppFromBP: {
        funcDecl: (decl_var, param) =>
          `float[3] ${decl_var}; UABT::SetFloatArray(${param}, ${decl_var});`,

        funcUsage: (decl_var) => `${decl_var};`,

        funcFree: () => '',
      },
      // decl: FVector BPVar = UABT::FromFloatArray(CppVar);
      // usage: BPVar;
      // free: none
      BPFromCpp: {
        funcDecl: (decl_var, param) =>
          `FVector ${decl_var} = UABT::FromFloatArray(${param});`,

        funcUsage: (decl_var) => `${decl_var};`,

        funcFree: () => '',
      },
    },
  ],
]);

export const map_one_category_basicconv_bpfromcpp = new Map<
  string,
  CppBPConversionData
>([
  [
    'Enum',
    {
      convFuncType: ConversionWayType.Basic,
      convFunc: AGORA_MUSTACHE_DATA.UABTEnum_WrapWithUE,
      convFuncAdditional01: '',
    },
  ],
  [
    'TArray',
    {
      convFuncType: ConversionWayType.BPFromCpp_NewFreeArrayData,
      convFunc: AGORA_MUSTACHE_DATA.SET_BP_ARRAY_DATA,
      convFuncAdditional01: '',
    },
  ],
]);

export const map_one_category_basicconv_cppfrombp = new Map<
  string,
  CppBPConversionData
>([
  [
    'Enum',
    {
      convFuncType: ConversionWayType.Basic,
      convFunc: AGORA_MUSTACHE_DATA.UABTEnum_ToRawValue,
      convFuncAdditional01: '',
    },
  ],

  [
    'Optional',
    {
      convFuncType: ConversionWayType.CppFromBP_CreateFreeOptData,
      convFunc: AGORA_MUSTACHE_DATA.CREATE_RAW_OPT_DATA,
      convFuncAdditional01: AGORA_MUSTACHE_DATA.FREE_RAW_OPT_DATA,
    },
  ],

  [
    'UCLASS_USTRUCT',
    {
      convFuncType: ConversionWayType.CppFromBP_NeedCallConvFunc,
      convFunc: AGORA_MUSTACHE_DATA.CREATE_RAW_DATA,
      convFuncAdditional01: AGORA_MUSTACHE_DATA.FREE_RAW_DATA,
    },
  ],

  [
    'TArray',
    {
      convFuncType: ConversionWayType.CppFromBP_NewFreeArrayData,
      convFunc: AGORA_MUSTACHE_DATA.NEW_RAW_ARRAY_DATA,
      convFuncAdditional01: AGORA_MUSTACHE_DATA.FREE_RAW_ARRAY_DATA,
    },
  ],
]);

// =============== Default Template ===============
const defaultTmpl_BasicType_NoConv: UEBPTypeConvData = {
  bpTypeName: '',
  bpDesignedDeclType: undefined,
  bpDesignedTypeSource: undefined,
  isCustomBPType: false,
  convFromCpp: {
    convFuncType: ConversionWayType.NoNeedConversion,
    convFunc: '',
    convFuncAdditional01: '',
  },
  convToCpp: {
    convFuncType: ConversionWayType.NoNeedConversion,
    convFunc: '',
    convFuncAdditional01: '',
  },
  defaultValue: undefined,
  parseArrayIsInBlackList: false, // black list: no basic parse
  parseArrayDesignedType: undefined, // White list: basic parse
  parsePointerForceEnable: false, // UCLASS needs to be parsed as pointer
  returnTypeDesignedType: undefined,
  returnTypeFailedValue: undefined,
  declTypeSPRule: DeclTypeSPRule.DefaultNoSP,
  cppDesignedDeclType: undefined,
};

const defaultTmpl_FString_NonConst: UEBPTypeConvData = {
  // char* cppvar = UABT::New(bpvar);
  ...defaultTmpl_BasicType_NoConv,
  bpTypeName: 'FString',
  convFromCpp: {
    convFuncType: ConversionWayType.BPFromCpp_FString,
    convFunc: 'UTF8_TO_TCHAR',
    convFuncAdditional01: '',
  },
  convToCpp: {
    convFuncType: ConversionWayType.CppFromBP_NewFreeData,
    convFunc: 'UABT::New_CharPtr',
    convFuncAdditional01: 'UABT::Free_CharPtr',
  },
  declTypeSPRule: DeclTypeSPRule.SP_String,
  parseArrayIsInBlackList: true,
};

const defaultTmpl_FString_NonConst_UnsignedChar: UEBPTypeConvData = {
  ...defaultTmpl_FString_NonConst,
  bpTypeName: 'FString',
  convFromCpp: {
    convFuncType: ConversionWayType.BPFromCpp_FString,
    convFunc: 'UTF8_TO_TCHAR',
    convFuncAdditional01: '',
  },
  convToCpp: {
    convFuncType: ConversionWayType.CppFromBP_NewFreeData,
    convFunc: 'UABT::New_UnsignedCharPtr',
    convFuncAdditional01: 'UABT::Free_UnsignedCharPtr',
  },
  parseArrayIsInBlackList: true,
};

const defaultTmpl_FString_Const: UEBPTypeConvData = {
  ...defaultTmpl_BasicType_NoConv,
  bpTypeName: 'FString',
  convFromCpp: {
    convFuncType: ConversionWayType.BPFromCpp_FString,
    convFunc: 'UTF8_TO_TCHAR',
    convFuncAdditional01: '',
  },
  convToCpp: {
    convFuncType: ConversionWayType.CppFromBP_NewFreeData,
    convFunc: 'UABT::New_ConstCharPtr',
    convFuncAdditional01: 'UABT::Free_ConstCharPtr',
  },
  declTypeSPRule: DeclTypeSPRule.SP_String,
  parseArrayIsInBlackList: true,
};

const defaultTmpl_FString_SetArray: UEBPTypeConvData = {
  ...defaultTmpl_BasicType_NoConv,
  bpTypeName: 'FString',
  convFromCpp: {
    convFuncType: ConversionWayType.BPFromCpp_NewFreeArrayData,
    convFunc: 'UABT::SetBPArrayData',
    convFuncAdditional01: '',
  },
  convToCpp: {
    convFuncType: ConversionWayType.CppFromBP_NewFreeArrayData,
    convFunc: 'UABT::New_CharArrayPtr',
    convFuncAdditional01: 'UABT::Free_CharArrayPtr',
  },
  declTypeSPRule: DeclTypeSPRule.SP_String,
  parseArrayIsInBlackList: true,
};

const defaultTmpl_Int64_Pointer: UEBPTypeConvData = {
  ...defaultTmpl_BasicType_NoConv,
  bpTypeName: 'int64',
  convFromCpp: {
    convFuncType: ConversionWayType.Basic,
    convFunc: 'UABT::FromInt64',
    convFuncAdditional01: '',
  },
  convToCpp: {
    convFuncType: ConversionWayType.Basic,
    convFunc: 'UABT::ToInt64',
    convFuncAdditional01: '',
  },
};

const defaultTmpl_FUABT_OPT: UEBPTypeConvData = {
  ...defaultTmpl_BasicType_NoConv,
  isCustomBPType: true,
  convFromCpp: {
    convFuncType: ConversionWayType.NoNeedConversion,
    convFunc: '',
    convFuncAdditional01: '',
  },
  convToCpp: {
    convFuncType: ConversionWayType.CppFromBP_CreateFreeOptData,
    convFunc: AGORA_MUSTACHE_DATA.CREATE_RAW_OPT_DATA,
    convFuncAdditional01: AGORA_MUSTACHE_DATA.FREE_RAW_OPT_DATA,
  },
};

const defaultTmpl_TrackID: UEBPTypeConvData = {
  ...defaultTmpl_BasicType_NoConv,
  bpTypeName: 'int64',
  convFromCpp: {
    convFuncType: ConversionWayType.Basic,
    convFunc: 'UABT::FromTrackID',
    convFuncAdditional01: '',
  },
  convToCpp: {
    convFuncType: ConversionWayType.Basic,
    convFunc: 'UABT::ToTrackID',
    convFuncAdditional01: '',
  },
};

// =============== Type 2 Type Conversion ===============
// also use type source as key
export const map_cppreg_2_bptype_conv_data = new Map<RegExp, UEBPTypeConvData>([
  [
    // char const[n] => FString
    /(?:const\s+)?char\s*(?:const\s*)?\[\s*\d+\s*\]/g,
    {
      ...defaultTmpl_FString_SetArray,
      bpTypeName: 'FString',
    },
  ],

  [
    /(?:const\s+)?char\s*(?:const\s*)?\[\s*\d+\s*\]/g,
    {
      ...defaultTmpl_FString_SetArray,
      bpTypeName: 'FString',
    },
  ],
]);

// key is decided to use type source as key
// if we need to use type name as key, we could make a new map.
export const map_bptype_conv_data: { [type_source: string]: UEBPTypeConvData } =
  {
    // Basic Type
    'bool': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'bool',
      defaultValue: 'false',
    },
    'int': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'int',
      defaultValue: '0',
    },
    'float': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'float',
      defaultValue: '0.0',
    },
    'double': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'FString',
      defaultValue: '0.0',
      convFromCpp: {
        convFuncType: ConversionWayType.Basic,
        convFunc: 'UABT::FromDouble',
        convFuncAdditional01: '',
      },

      convToCpp: {
        convFuncType: ConversionWayType.Basic,
        convFunc: 'UABT::ToDouble',
        convFuncAdditional01: '',
      },
    },

    // basic type
    'unsigned short': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'int',
      defaultValue: '0',
    },
    'unsigned int': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'int64',
      defaultValue: '0',
    },
    'long': {
      ...defaultTmpl_Int64_Pointer,
      bpTypeName: 'int64',
      defaultValue: '0',
    },

    'long long': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'int64',
      defaultValue: '0',
    },

    // not builtin type
    'uint8_t': {
      // TBD(WinterPu) should be Byte, however Byte may not be supported in UE4.25
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'int',
      defaultValue: '0',
    },
    'uint16_t': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'int',
      defaultValue: '0',
    },
    'uint32_t': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'int64',
      defaultValue: '0',
      convFromCpp: {
        convFuncType: ConversionWayType.Basic,
        convFunc: 'UABT::FromUint32',
        convFuncAdditional01: '',
      },
      convToCpp: {
        convFuncType: ConversionWayType.Basic,
        convFunc: 'UABT::ToUint32',
        convFuncAdditional01: '',
      },
    },
    'uint64_t': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'FString',
      defaultValue: '0',
    },
    'int16_t': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'int',
      defaultValue: '0',
    },
    'int32_t': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'int',
      defaultValue: '0',
    },
    'int64_t': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'int64',
      defaultValue: '0',
    },

    // FVector Related
    'float const[3]': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'FVector',
      defaultValue: 'FVector(0.0, 0.0, 0.0)',
      parseArrayIsInBlackList: true,
    },

    // FString Related
    'const char*': {
      ...defaultTmpl_FString_Const,
    },
    'char const*': {
      ...defaultTmpl_FString_Const,
    },
    'unsigned char const*': {
      ...defaultTmpl_FString_Const,
    },
    'unsigned char*': {
      // TBD(WinterPu) check it
      ...defaultTmpl_FString_NonConst,
      bpTypeName: 'FString',
    },
    'char*': {
      ...defaultTmpl_FString_NonConst,
      bpTypeName: 'FString',
      convFromCpp: {
        convFuncType: ConversionWayType.BPFromCpp_FString,
        convFunc: 'UTF8_TO_TCHAR',
        convFuncAdditional01: '',
      },
      convToCpp: {
        convFuncType: ConversionWayType.CppFromBP_SetData,
        convFunc: 'UABT::SetCharArrayPtr',
        convFuncAdditional01: '',
      },
    },

    'char const**': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'FString',
      bpDesignedTypeSource: 'TArray<FString>',
      parsePointerForceEnable: true,
    },

    'char**': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'FString',
      bpDesignedTypeSource: 'TArray<FString>',
      parsePointerForceEnable: true,
      convFromCpp: {
        convFuncType: ConversionWayType.BPFromCpp_NewFreeArrayData,
        convFunc: '',
        convFuncAdditional01: '',
      },
      convToCpp: {
        convFuncType: ConversionWayType.CppFromBP_NewFreeData,
        convFunc: 'UABT::New_CharArrayPtr',
        convFuncAdditional01: 'UABT::Free_CharArrayPtr',
      },
    },

    // Array Related

    'float*': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'TArray<float>',
      convFromCpp: {
        convFuncType: ConversionWayType.Basic,
        convFunc: 'UABT::FromFloatArray',
        convFuncAdditional01: '',
      },
      convToCpp: {
        convFuncType: ConversionWayType.CppFromBP_NewFreeArrayData,
        convFunc: 'UABT::New_FloatArrayPtr',
        convFuncAdditional01: 'UABT::Free_FloatArrayPtr',
      },
    },

    'int const*': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'int',
      bpDesignedTypeSource: 'TArray<int>',
      parsePointerForceEnable: true,
    },

    'uid_t*': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'int64',
      bpDesignedTypeSource: 'TArray<int64>',
      convFromCpp: {
        convFuncType: ConversionWayType.BPFromCpp_NewFreeArrayData,
        convFunc: '',
        convFuncAdditional01: '',
      },
      convToCpp: {
        convFuncType: ConversionWayType.CppFromBP_NewFreeArrayData,
        convFunc: 'UABT::New_UIDArrayPtr',
        convFuncAdditional01: 'UABT::Free_UIDArrayPtr',
      },
    },

    'agora::rtc::Music*': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'FUABT_Music',
      parseArrayIsInBlackList: true,
    },

    'agora::rtc::MusicChartInfo*': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'FUABT_MusicChartInfo',
      parseArrayIsInBlackList: true,
    },
    'agora::rtc::IScreenCaptureSourceList*': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'FUABT_ScreenCaptureSourceList',
      parseArrayIsInBlackList: true,
      parsePointerForceEnable: true,
    },

    // Pointer Related
    'void*': {
      // TBD(WinterPu) check it
      ...defaultTmpl_Int64_Pointer,
      bpTypeName: 'int64',
      defaultValue: '0',
    },

    // Agora Related
    'agora::rtc::uid_t': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'int64',
      convFromCpp: {
        convFuncType: ConversionWayType.Basic,
        convFunc: 'UABT::FromUID',
        convFuncAdditional01: '',
      },
      convToCpp: {
        convFuncType: ConversionWayType.Basic,
        convFunc: 'UABT::ToUID',
        convFuncAdditional01: '',
      },
    },
    'agora::user_id_t': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'FString',

      convFromCpp: {
        convFuncType: ConversionWayType.Basic,
        convFunc: 'UABT::FromUserID',
        convFuncAdditional01: '',
      },

      convToCpp: {
        convFuncType: ConversionWayType.Basic,
        convFunc: 'UABT::ToUserID',
        convFuncAdditional01: '',
      },
    },
    'agora::view_t': {
      // TBD(WinterPu) store pointer address
      // TBD(WinterPu) combine it to tmpl
      ...defaultTmpl_Int64_Pointer,
      bpTypeName: 'int64',
      convFromCpp: {
        convFuncType: ConversionWayType.Basic,
        convFunc: 'UABT::FromViewToInt',
        convFuncAdditional01: '',
      },
      convToCpp: {
        convFuncType: ConversionWayType.Basic,
        convFunc: 'UABT::ToView',
        convFuncAdditional01: '',
      },
    },
    'media::base::view_t': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'int64',
      convFromCpp: {
        convFuncType: ConversionWayType.Basic,
        convFunc: 'UABT::FromViewToInt',
        convFuncAdditional01: '',
      },
      convToCpp: {
        convFuncType: ConversionWayType.Basic,
        convFunc: 'UABT::ToView',
        convFuncAdditional01: '',
      },
    },
    'base::user_id_t': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'FString',
    },
    'rtc::uid_t': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'int64',
    },
    'rtc::track_id_t': {
      ...defaultTmpl_TrackID,
      bpTypeName: 'int64',
      convFromCpp: {
        convFuncType: ConversionWayType.Basic,
        convFunc: 'UABT::FromVTID',
        convFuncAdditional01: '',
      },
      convToCpp: {
        convFuncType: ConversionWayType.Basic,
        convFunc: 'UABT::ToVTID',
        convFuncAdditional01: '',
      },
    },
    'agora::rtc::track_id_t': {
      ...defaultTmpl_TrackID,
      bpTypeName: 'int64',
      // TBD(WinterPu) combine it to tmpl
      convFromCpp: {
        convFuncType: ConversionWayType.Basic,
        convFunc: 'UABT::FromVTID',
        convFuncAdditional01: '',
      },
      convToCpp: {
        convFuncType: ConversionWayType.Basic,
        convFunc: 'UABT::ToVTID',
        convFuncAdditional01: '',
      },
    },
    'agora::rtc::video_track_id_t': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'int64',
    },
    'agora::util::AString&': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'FString',
    },

    'size_t': {
      ...defaultTmpl_BasicType_NoConv,
      bpTypeName: 'int64',
      defaultValue: '0',
    },

    // Custom Defined Type
    'Optional<bool>': {
      ...defaultTmpl_FUABT_OPT,
      bpTypeName: 'FUABT_Opt_bool',
    },
    'Optional<agora::rtc::VIDEO_STREAM_TYPE>': {
      ...defaultTmpl_FUABT_OPT,
      bpTypeName: 'FUABT_Opt_VIDEO_STREAM_TYPE',
    },
    'Optional<double>': {
      ...defaultTmpl_FUABT_OPT,
      bpTypeName: 'FUABT_Opt_double',
    },
    'Optional<int>': {
      ...defaultTmpl_FUABT_OPT,
      bpTypeName: 'FUABT_Opt_int',
    },
    'Optional<agora::rtc::CAMERA_DIRECTION>': {
      ...defaultTmpl_FUABT_OPT,
      bpTypeName: 'FUABT_Opt_CAMERA_DIRECTION',
    },
    'Optional<agora::rtc::CAMERA_FOCAL_LENGTH_TYPE>': {
      ...defaultTmpl_FUABT_OPT,
      bpTypeName: 'FUABT_Opt_CAMERA_FOCAL_LENGTH_TYPE',
    },
    'Optional<const char *>': {
      ...defaultTmpl_FUABT_OPT,
      bpTypeName: 'FUABT_Opt_ConstCharPtr',
    },
    'Optional<agora::rtc::CLIENT_ROLE_TYPE>': {
      ...defaultTmpl_FUABT_OPT,
      bpTypeName: 'FUABT_Opt_CLIENT_ROLE_TYPE',
    },
    'Optional<agora::rtc::AUDIENCE_LATENCY_LEVEL_TYPE>': {
      ...defaultTmpl_FUABT_OPT,
      bpTypeName: 'FUABT_Opt_AUDIENCE_LATENCY_LEVEL_TYPE',
    },
    'Optional<agora::CHANNEL_PROFILE_TYPE>': {
      ...defaultTmpl_FUABT_OPT,
      bpTypeName: 'FUABT_Opt_CHANNEL_PROFILE_TYPE',
    },
    'Optional<agora::rtc::video_track_id_t>': {
      ...defaultTmpl_FUABT_OPT,
      bpTypeName: 'FUABT_Opt_video_track_id_t',
    },
    'Optional<agora::rtc::THREAD_PRIORITY_TYPE>': {
      ...defaultTmpl_FUABT_OPT,
      bpTypeName: 'FUABT_Opt_THREAD_PRIORITY_TYPE',
    },
  };

// =============== Specific To One Variable Special Rule ===============
// key: variable full name

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

// Ex.
export const map_empty_name_enum: { [key: string]: string } = {
  /*
    class IAudioFrameObserverBase {
    public:
    enum { MAX_HANDLE_TIME_CNT = 10 };
  };
  */
  'agora::media::IAudioFrameObserverBase': 'MAX_HANDLE_TIME_CNT',

  /*
  #ifndef OPTIONAL_ENUM_SIZE_T
  #if __cplusplus >= 201103L || (defined(_MSC_VER) && _MSC_VER >= 1800)
  #define OPTIONAL_ENUM_SIZE_T enum : size_t
  #else
  #define OPTIONAL_ENUM_SIZE_T enum
  #endif
  #endif

  struct VideoFormat {
    OPTIONAL_ENUM_SIZE_T{
        kMaxWidthInPixels = 3840,
        kMaxHeightInPixels = 2160,
        kMaxFps = 60,
    };
  };
  */
  'agora::rtc::VideoFormat': 'VideoFormat_OPTIONAL_ENUM_SIZE_T',

  /*
  struct AudioPcmFrame {
    OPTIONAL_ENUM_SIZE_T{
        kMaxDataSizeSamples = 3840,
        kMaxDataSizeBytes = kMaxDataSizeSamples * sizeof(int16_t),
    };
  };
  */
  'agora::rtc::AudioPcmFrame': 'AudioPcmFrame_OPTIONAL_ENUM_SIZE_T',
};

// // For parameters' type
// // [Key] type.source namespace removed
// export const map_cpptype_2_uebptype: { [key: string]: string } = {
//   'void': 'void',
//   'int': 'int',
//   'float': 'float',
//   'double': 'FString',
//   'const char*': 'FString',
//   'char const*': 'FString',
//   'unsigned char const*': 'FString',
//   'char*': 'FString',

//   'unsigned short': 'int',
//   'unsigned int': 'int64',

//   //not builtin type
//   'uint8_t': 'int', // TBD(WinterPu) should be Byte, however Byte may not be supported in UE4.25
//   'int32_t': 'int',
//   'uint32_t': 'int64',
//   'int64_t': 'int64',
//   'uint64_t': 'FString',
//   'int16_t': 'int',
//   'uint16_t': 'int',

//   'agora::rtc::uid_t': 'int64',
//   'agora::user_id_t': 'FString',
//   'agora::view_t': 'int64', // TBD(WinterPu) store pointer address
//   'base::user_id_t': 'FString',
//   'rtc::uid_t': 'int64',
//   'rtc::track_id_t': 'int64',
//   'agora::rtc::track_id_t': 'int64',
//   'agora::rtc::video_track_id_t': 'int64',
//   'media::base::view_t': 'int64',
//   'agora::util::AString&': 'FString',
//   'unsigned char*': 'FString',
//   'void*': 'int64', // TBD(WinterPu)
//   'long': 'int64', // TBD(WinterPu) check it

//   // 'long long': 'int64',

//   // [TBD] some types that may have issues"
//   'size_t': 'int64',

//   'float const[3]': 'FVector',

//   // ==== agora special =====

//   // Optional
//   'Optional<bool>': 'FUABT_Opt_bool',
//   'Optional<agora::rtc::VIDEO_STREAM_TYPE>': 'FUABT_Opt_VIDEO_STREAM_TYPE',
//   'Optional<double>': 'FUABT_Opt_double',
//   'Optional<int>': 'FUABT_Opt_int',
//   'Optional<agora::rtc::CAMERA_DIRECTION>': 'FUABT_Opt_CAMERA_DIRECTION',
//   'Optional<agora::rtc::CAMERA_FOCAL_LENGTH_TYPE>':
//     'FUABT_Opt_CAMERA_FOCAL_LENGTH_TYPE',
//   'Optional<const char *>': 'FUABT_Opt_ConstCharPtr',
//   'Optional<agora::rtc::CLIENT_ROLE_TYPE>': 'FUABT_Opt_CLIENT_ROLE_TYPE',
//   'Optional<agora::rtc::AUDIENCE_LATENCY_LEVEL_TYPE>':
//     'FUABT_Opt_AUDIENCE_LATENCY_LEVEL_TYPE',
//   'Optional<agora::CHANNEL_PROFILE_TYPE>': 'FUABT_Opt_CHANNEL_PROFILE_TYPE',
//   'Optional<agora::rtc::video_track_id_t>': 'FUABT_Opt_video_track_id_t',
//   'Optional<agora::rtc::THREAD_PRIORITY_TYPE>':
//     'FUABT_Opt_THREAD_PRIORITY_TYPE',
// };

// export const regex_cpptype_2_uebptype_blacklist = new Map<RegExp, string>([
//   [/(?:const\s+)?char\s*(?:const\s*)?\[\s*\d+\s*\]/g, 'FString'], // char const[n]
// ]);

// // type convert functions

// // TBD(WinterPu)
// // 1. int64 => agora::rtc::uid_t

// export const map_cpp2bp_convert_function_name: { [key: string]: string } = {
//   'view_t': 'UABT::FromViewToInt',
//   'double': 'UABT::FromDouble',
//   'const char*': 'UTF8_TO_TCHAR',
//   'char const*': 'UTF8_TO_TCHAR',
//   // array
//   'float*': 'UABT::FromFloatArray',
// };

// // [key]: still use cpp type
// export const map_bp2cpp_convert_function_name: { [key: string]: string } = {
//   double: 'UABT::ToDouble',

//   uid_t: 'UABT::ToUID',
//   uint32_t: 'UABT::ToUInt32',
//   track_id_t: 'UABT::ToVTID',
//   view_t: 'UABT::ToView',
// };

// export const map_bp2cpp_memory_handle: { [key: string]: [string, string] } = {
//   // FString
//   'const char*': ['UABT::New_ConstCharPtr', 'UABT::Free_ConstCharPtr'],
//   'char const*': ['UABT::New_ConstCharPtr', 'UABT::Free_ConstCharPtr'],
//   'char*': ['UABT::New_CharPtr', 'UABT::Free_CharPtr'],
//   'unsigned char*': ['UABT::New_UnsignedCharPtr', 'UABT::Free_UnsignedCharPtr'],
//   'char**': ['UABT::New_CharArrayPtr', 'UABT::Free_CharArrayPtr'],
//   'uid_t*': ['UABT::New_UIDArrayPtr', 'UABT::Free_UIDArrayPtr'],

//   'generic': ['UABT::New_RawData', 'UABT::Free_RawData'],
//   'genericArray': ['UABT::New_RawDataArray', 'UABT::Free_RawDataArray'],
// };

// export const map_setdata_function_name: { [key: string]: string } = {
//   //[TBD] need to add flag to judge if it needs to use set data

//   //example:
//   // UABT::SetCharArrayPtr(AgoraData.userAccount, this->userAccount, agora::rtc::MAX_USER_ACCOUNT_LENGTH);
//   // No need to free memory
//   'char*': 'UABT::SetCharArrayPtr',
// };

// export const map_cpptype_default_value: { [key: string]: string } = {
//   'int': '0',
//   'float': '0.0',
//   'double': '0.0',
//   'const char*': '""',
//   'char const*': '""',
//   'bool': 'false',

//   'unsigned short': '0',
//   'unsigned int': '0',

//   'uint8_t': '0',
//   'int32_t': '0',
//   'uint32_t': '0',
//   'int64_t': '0',
//   'uint64_t': '0',
//   'uid_t': '0',

//   'long long': '0',

//   'size_t': '0',
//   'void*': 'nullptr',

//   'unsigned char const*': '""',

//   // ==== agora special =====
// };

// // TBD(WinterPu)
// // 1. const FString & or FString

// // TBD(WinterPu)
// // 1. When bp to cpp raw: FString => std::string / not: const char *
// // 2. const char * => FString

// export enum SpecialDeclTypeRule {
//   RULE_STR_BP2CPP = 'SPECIAL_DECL_TYPE_RULE_string_bp2cpp', // const char* => std::string
//   RULE_STR_CPP2BP = 'SPECIAL_DECL_TYPE_RULE_string_cpp2bp', // std::string => const char*

//   RULE_FVECTOR_BP2CPP = 'SPECIAL_DECL_TYPE_RULE_string_bp2cpp_fvector', // float const[3] => FVector
//   RULE_FVECTOR_CPP2BP = 'SPECIAL_DECL_TYPE_RULE_string_cpp2bp_fvector', // FVector => float const[3]
// }

// // For declaration type
// export const map_convdecltype_bp2cpp: { [key: string]: string } = {
//   'const char*': SpecialDeclTypeRule.RULE_STR_BP2CPP,
//   'char const*': SpecialDeclTypeRule.RULE_STR_BP2CPP,

//   'float const[3]': SpecialDeclTypeRule.RULE_FVECTOR_BP2CPP,
// };

// // key: type source
// export const map_convdecltype_cpp2bp: { [key: string]: string } = {
//   'const char*': SpecialDeclTypeRule.RULE_STR_CPP2BP,
//   'char const*': SpecialDeclTypeRule.RULE_STR_CPP2BP,
//   'float const[3]': SpecialDeclTypeRule.RULE_FVECTOR_CPP2BP,
// };

// ///// ========== For Array Parsing ==========

// // should exclude
// export const map_parse_array_blacklist: { [key: string]: boolean } = {
//   'unsigned char const*': true,
//   'unsigned char*': true,
//   'char const*': true, // const char* => const FString &
//   'char*': true,
//   'float const[3]': true, // float const[3] => FVector
// };

// export const regex_parse_array_blacklist: RegExp[] = [
//   /(?:const\s+)?char\s*(?:const\s*)?\[\s*\d+\s*\]/g, // char const[n]
//   // 可以添加更多规则
// ];

// // should do conversion
// // Here, the value should be: TArray<type> without ex. const qualifier
// // they would be added in the latter process
// export const map_parse_array_whitelist: { [key: string]: string } = {
//   'int const*': 'TArray<int>',
//   'char const**': 'TArray<FString>',
// };

// // Agora Special
// // judge in lower case
// export const not_parse_array_type_based_on_agora: string[] = [
//   'observer',
//   'eventhandler',
//   'audiopcmframesink',
// ];

// // TBD(WinterPu)
// // Better to use: namespace.class.method
// export const not_parse_array_type_for_return_type: string[] = [
//   'agora::rtc::Music*',
//   'agora::rtc::MusicChartInfo*',
//   'agora::rtc::IScreenCaptureSourceList*',
// ];

// export const keep_pointer_type_list: string[] = [
//   'agora::rtc::IScreenCaptureSourceList*',
// ];
