import {
  CXXTYPE,
  ConstructorInitializer,
  MemberFunction,
  MemberVariable,
  SimpleType,
} from '@agoraio-extensions/cxx-parser/src/cxx_terra_node';

import * as Logger from '../logger';

import * as Tools from '../tools';

import * as BPHelper from './bp_helper';

import {
  ClazzAddtionalContext_,
  SpecialDeclTypeRule,
  map_bp2cpp_convert_function_name,
  map_bp2cpp_memory_handle,
  map_class_initialization,
  map_convdecltype_bp2cpp,
  map_convdecltype_cpp2bp,
  map_cpp2bp_convert_function_name,
  map_cpptype_2_uebptype,
  map_cpptype_default_value,
  map_native_ptr_name,
  map_parse_array_blacklist,
  map_parse_array_whitelist,
  map_setdata_function_name,
  regex_cpptype_2_uebptype_blacklist,
  regex_parse_array_blacklist,
} from './bptype_data';
import { AGORA_MUSTACHE_DATA } from './bptype_mustache_data';

export function getConvMap_CppToBP() {
  return map_cpptype_2_uebptype;
}

export class ConvDeclTypeData {
  convDeclType: string;

  // Special Rule
  // Example:
  // std::string a = TCHAR_TO_UTF8(*b);
  // usage: a.c_str()
  enableSpecialRule: boolean;
  specialRuleConvType: ConversionWayType;
  convFunc: string;
  needDereference: boolean; // as arg: TCHAR_TO_UTF8(*b)
  useMemberFunc: string; // as a.c_str()
  numSetDataSize: string; // SetData(a,b,numSetDataSize)
  constructor() {
    this.convDeclType = '';

    this.enableSpecialRule = false;
    this.specialRuleConvType = ConversionWayType.NoNeedConversion;
    this.convFunc = '';
    this.needDereference = false;
    this.useMemberFunc = '';
    this.numSetDataSize = '';
  }
  toString(): string {
    return `ConvDeclTypeData {
      convDeclType: ${this.convDeclType}

      // Special Rule ..... 
      enableSpecialRule: ${this.enableSpecialRule}
      specialRuleConvType: ${this.specialRuleConvType}
      convFunc: ${this.convFunc}
      needDereference: ${this.needDereference}
      useMemberFunc: ${this.useMemberFunc}
      numSetDataSize: ${this.numSetDataSize}
    }`;
  }
}

export enum ConversionWayType {
  NoNeedConversion, // no need conversion
  Basic, // need call basic conversion method

  // BP = FuncFrom(Cpp);

  // Cpp = FuncTo(BP);
  CppFromBP_NewFreeData, // need memory allocation
  CppFromBP_SetData, // directly set data
  CppFromBP_CreateFreeOptData, // need memory allocation
  // Example: CreateRawData()
  CppFromBP_NeedCallConvFunc, // need call conversion function
}

export class UEBPType {
  cppTypeName: string;
  cppTypeSource: string;
  cppTypeNameWithoutNamespace: string;
  cppTypeSourceWithoutNamespace: string;

  // Direct Convert
  // BP
  name: string; // [bpTypeName] type name of blueprint: Ex. FString
  source: string; // [bpTypeSource] type with full qualifier: Ex. const FString &

  // bp = FuncFrom(cpp);
  bpConv_BPFromCpp: CppBPConversionData;
  // bpNeedConvFunc_BPFromCpp: boolean;
  // bpConvWayType_BPFromCpp: ConvWayType_BPFromCpp;
  // bpNameConvFunc_BPFromCpp: string;

  // cpp = FuncTo(bp);
  bpConv_CppFromBP: CppBPConversionData;
  // bpNeedConvFunc_CppFromBP: boolean;
  // bpConvWayType_CppFromBP: ConvWayType_CppFromBP;
  // bpNameConvFunc_CppFromBP: string;
  // // Example:
  // // bpNameConvFunc_CppFromBP [NewRawData]
  // // bpNameConvFuncAdditional_CppFromBP: [FreeRawData]
  // bpNameConvFuncAdditional_CppFromBP: string;

  // Convert In Impl:
  bpConvDeclType_BPFromCpp: ConvDeclTypeData;
  bpConvDeclType_CppFromBP: ConvDeclTypeData;

  constructor() {
    this.cppTypeName = '';
    this.cppTypeSource = '';
    this.cppTypeNameWithoutNamespace = '';
    this.cppTypeSourceWithoutNamespace = '';

    this.name = '';
    this.source = '';

    this.bpConv_BPFromCpp = new CppBPConversionData();
    this.bpConv_CppFromBP = new CppBPConversionData();

    this.bpConvDeclType_BPFromCpp = new ConvDeclTypeData();
    this.bpConvDeclType_CppFromBP = new ConvDeclTypeData();
  }

  toString(): string {
    return `UEBPType {
        // C++ Type Info:
        cppTypeName: "${this.cppTypeName}"
        cppTypeSource: "${this.cppTypeSource}"
        cppTypeNameWithoutNamespace: "${this.cppTypeNameWithoutNamespace}"
        cppTypeSourceWithoutNamespace: "${this.cppTypeSourceWithoutNamespace}"

        // Blueprint Type Info:
        name: "${this.name}"  // Blueprint type name
        source: "${this.source}"  // Blueprint type with qualifiers

        // Conversion from C++ to BP:
        bpConv_BPFromCpp: "${this.bpConv_BPFromCpp.toString()}"

        // Conversion from BP to C++:
        bpConv_CppFromBP: "${this.bpConv_CppFromBP.toString()}"

        // Convert In Impl:
        bpConvDeclTypeSpecialRule_BPFromCpp: "${this.bpConvDeclType_BPFromCpp.toString()}"
        bpConvDeclTypeSpecialRule_CppFromBP: "${this.bpConvDeclType_CppFromBP.toString()}"
    }`;
  }
}

// No need to declare first
// // Declare the function type
// function genConvDeclType_WithSpecialDeclTypeRule(val: string): ConvDeclTypeData;

export class CppBPConversionData {
  convNeeded: boolean;
  convFuncType: ConversionWayType;
  convFunc: string;
  convFuncAdditional01: string; // Ex. free data conv function
  convAdditionalFuncParam01: string; // Ex. SetData(a,b,Size)
  bpTypeName: string;

  constructor() {
    this.convNeeded = false;
    this.convFuncType = ConversionWayType.NoNeedConversion;
    this.convFunc = '';
    this.convFuncAdditional01 = '';
    this.convAdditionalFuncParam01 = '';
    this.bpTypeName = '';
  }
  toString(): string {
    return `CppBPConversionData {
      convNeeded: ${this.convNeeded}
      convFuncType: ${this.convFuncType}
      convFunc: ${this.convFunc}
      convFuncAdditional01: ${this.convFuncAdditional01}
      convAdditionalFuncParam01: ${this.convAdditionalFuncParam01}
      bpTypeName: ${this.bpTypeName}
    }`;
  }
}
function genBPConvertFromRawType(type: SimpleType): CppBPConversionData {
  // bp = Func(cpp);
  let conversion = new CppBPConversionData();

  // Enum
  const key_registeredsource = BPHelper.getRegisteredBPSearchKey(type);
  let [typeCategory, bpTypeName] =
    BPHelper.getRegisteredBPType(key_registeredsource);
  if (typeCategory == CXXTYPE.Enumz) {
    conversion.convNeeded = true;
    conversion.convFuncType = ConversionWayType.Basic;
    conversion.convFunc = AGORA_MUSTACHE_DATA.UABTEnum_WrapWithUE;
    conversion.convFuncAdditional01 = '';
    conversion.bpTypeName = bpTypeName;
  }

  let convert_function = map_cpp2bp_convert_function_name[type.source];
  if (convert_function) {
    conversion.convNeeded = true;
    conversion.convFuncType = ConversionWayType.Basic;
    conversion.convFunc = convert_function;
    conversion.convFuncAdditional01 = '';
    conversion.bpTypeName = bpTypeName;
  } else {
  }

  return conversion;
}

function genBPConvertToRawType(type: SimpleType): CppBPConversionData {
  // cpp = Func(bp);
  let conversion = new CppBPConversionData();
  // UEnum
  const key_registeredsource = BPHelper.getRegisteredBPSearchKey(type);
  let [typeCategory, bpTypeName] =
    BPHelper.getRegisteredBPType(key_registeredsource);
  if (typeCategory == CXXTYPE.Enumz) {
    conversion.convNeeded = true;
    conversion.convFuncType = ConversionWayType.Basic;
    conversion.convFunc = AGORA_MUSTACHE_DATA.UABTEnum_ToRawValue;
    conversion.convFuncAdditional01 = '';
    conversion.bpTypeName = bpTypeName;
  }

  if (typeCategory === CXXTYPE.Clazz || typeCategory === CXXTYPE.Struct) {
    if (Tools.IsOptionalUABTType(bpTypeName)) {
      conversion.convNeeded = true;
      conversion.convFuncType = ConversionWayType.CppFromBP_CreateFreeOptData;
      conversion.convFunc = AGORA_MUSTACHE_DATA.CREATE_RAW_OPT_DATA;
      conversion.convFuncAdditional01 = AGORA_MUSTACHE_DATA.FREE_RAW_OPT_DATA;
    } else {
      conversion.convNeeded = true;
      conversion.convFuncType = ConversionWayType.CppFromBP_NeedCallConvFunc;
      conversion.convFunc = AGORA_MUSTACHE_DATA.CREATE_RAW_DATA;
      conversion.convFuncAdditional01 = AGORA_MUSTACHE_DATA.FREE_RAW_DATA;
    }
    conversion.bpTypeName = bpTypeName;
  }

  let convert_function = map_bp2cpp_convert_function_name[type.source];
  if (convert_function) {
    conversion.convNeeded = true;
    conversion.convFuncType = ConversionWayType.Basic;
    conversion.convFunc = convert_function;
    conversion.convFuncAdditional01 = '';
  } else {
    let func_memorys = map_bp2cpp_memory_handle[type.source];
    if (func_memorys) {
      conversion.convNeeded = true;
      conversion.convFuncType = ConversionWayType.CppFromBP_NewFreeData;
      conversion.convFunc = func_memorys[0]; // New Data
      conversion.convFuncAdditional01 = func_memorys[1]; // Free Data
    } else {
      let set_data_func = map_setdata_function_name[type.source];
      if (set_data_func) {
        conversion.convNeeded = true;
        conversion.convFuncType = ConversionWayType.CppFromBP_SetData;
        conversion.convFunc = set_data_func;
        conversion.convFuncAdditional01 = '';
        conversion.convAdditionalFuncParam01 = Tools.extractBracketNumber(
          type.source
        );
      }
    }
  }

  return conversion;
}

// TBD(WinterPu) - TArray<char>
// 函数：检查字符串是否为数组类型，并返回类型名或原始类型
//// we use: regex + blacklist + whitelist
export function parseArrayType(
  typeSource: string,
  refBPTypeName: string = 'only_check_if_it_is_an_array'
): [boolean, string] {
  // Regex to check
  // 匹配格式为 typeName[n] 或 typeName[] 的字符串
  const regex = /^(.*?)(\[\d+\]|\[\])$/;
  const match = regex.exec(typeSource);

  // Black List
  if (map_parse_array_blacklist[typeSource]) {
    return [false, typeSource];
  }

  if (typeSource === 'char const[512]') {
    debugger;
  }

  // return in ForEach would not stop the loop
  if (regex_parse_array_blacklist.some((regex) => regex.test(typeSource))) {
    return [false, typeSource];
  }

  // White List
  // TBD(WinterPu):
  // It would have (const int* list, int listNum)
  // Should combine them together
  if (map_parse_array_whitelist[typeSource]) {
    return [true, map_parse_array_whitelist[typeSource]];
  }

  // TBD(WinterPu):
  // you may defined in [map_parse_array_whitelist] and it doesn't match [refBPTypeName]

  // 如果匹配成功，返回 true 和类型名
  if (match) {
    // Here, if it is a array, you should use [refBPTypeName]
    let matched_array_type = 'TArray<' + refBPTypeName + '>';
    return [true, matched_array_type]; // match[1] 是去掉数组标记后的类型名
  }

  // 如果不匹配，返回 false 和原始类型
  return [false, typeSource];
}

/* 
            "type": {
                "__TYPE": "SimpleType",
                "is_builtin_type": true,
                "is_const": true,
                "kind": 101,
                "name": "char",
                "source": "char const*",
                "template_arguments": []
            }


            "return_type": {
              "__TYPE": "SimpleType",
              "is_builtin_type": false,
              "is_const": false,
              "kind": 102,
              "name": "CopyableAutoPtr<T>",
              "source": "CopyableAutoPtr<T>&",
              "template_arguments": []
            },
            "signature": "(const CopyableAutoPtr<T>&)",
            "source": ""


            "type": {
                "__TYPE": "SimpleType",
                "is_builtin_type": false,
                "is_const": true,
                "kind": 102,
                "name": "agora::rtc::RtcConnection",
                "source": "agora::rtc::RtcConnection const&",
                "template_arguments": []
            }

            "type": {
              "__TYPE": "SimpleType",
              "is_builtin_type": false,
              "is_const": false,
              "kind": 104,
              "name": "Optional",
              "source": "Optional<bool>",
              "template_arguments": ["bool"]
            }
*/
export function convertToBPType(
  type: SimpleType,
  isOutput?: boolean
): UEBPType {
  let result = new UEBPType();
  result.cppTypeName = type.name;
  result.cppTypeSource = type.source;
  console.log('convertToBPType', type.source);

  // **** First Step: Directly Searching in the map ****
  // Try to get [bpTypeName]

  // use [source type] to get a full type
  // builtin type: usually directly set value.
  // Mapping multiple times
  // Try to get the type name of Blueprint
  // [ nameType / SourceType ] => [ bpTypeName ]

  // Here, almost you got the built-in unreal blueprint type
  let tmpTypeName_DirectMappingResult = map_cpptype_2_uebptype[type.source];
  if (Tools.isNullOrEmpty(tmpTypeName_DirectMappingResult)) {
    tmpTypeName_DirectMappingResult = map_cpptype_2_uebptype[type.name];
  } else if (Tools.isNullOrEmpty(tmpTypeName_DirectMappingResult)) {
    tmpTypeName_DirectMappingResult =
      map_cpptype_2_uebptype[Tools.removeNamespace(type.source)];
  } else if (Tools.isNullOrEmpty(tmpTypeName_DirectMappingResult)) {
    tmpTypeName_DirectMappingResult =
      map_cpptype_2_uebptype[Tools.removeNamespace(type.name)];
  }

  for (const [regex, replacement] of regex_cpptype_2_uebptype_blacklist) {
    // TBD(WinterPu):
    // what if one pattern meets multiple regex

    // reset regex lastIndex:
    // so it would not be affected by previous test
    regex.lastIndex = 0;
    if (regex.test(type.source)) {
      tmpTypeName_DirectMappingResult = replacement;
    }
    if (regex.test(Tools.removeNamespace(type.source))) {
      tmpTypeName_DirectMappingResult = replacement;
    }
  }

  if (!Tools.isNullOrEmpty(tmpTypeName_DirectMappingResult)) {
    result.name = tmpTypeName_DirectMappingResult;
  } else {
    // Not Founded

    // **** Second Step: If failed, analyze the type ****
    // Try to get [bpTypeName]

    // Enum / Class / Struct's name is without namespace
    // type.name has namespace
    // TBD(WinterPu):
    // 1. is it possible to have namespace in the middle[ex. Optional<agora::rtc::RtcConnection>]
    const key_registeredsource = BPHelper.getRegisteredBPSearchKey(type);
    let [typeCategory, bpTypeNameTmp] =
      BPHelper.getRegisteredBPType(key_registeredsource);

    if (typeCategory != CXXTYPE.Unknown) {
      result.name = bpTypeNameTmp;
    } else {
      Logger.PrintError(
        `convertToBPType: No Conversion Mapping ${type.source}`
      );
      result.name = type.name;
    }
  }

  // **** Third Step: Get [bpTypeSource] from [bpTypeName] ****
  // [bpTypeName] => [bpTypeSource]
  let tmpTypeSource = result.name;

  // is array
  // check if it is a array
  // analyze if it is a array type
  let [isArray, arrayType] = parseArrayType(type.source, result.name);
  if (isArray) {
    tmpTypeSource = arrayType;
  }

  // is_const  /  isOutput
  // TBD(WinterPu)
  // 1. char* how to handle
  // 2. char** how to handle
  // 3. Set / Map ...
  if (isOutput !== undefined) {
    if (isOutput) {
      // isOutput 是 true
      tmpTypeSource = tmpTypeSource + ' &';
    } else {
      // isOutput 是 false

      // const
      if (type.is_const) {
        tmpTypeSource = 'const ' + tmpTypeSource + ' &';
      }
    }
  } else {
    // const
    if (type.is_const) {
      tmpTypeSource = 'const ' + tmpTypeSource + ' &';
    }
  }

  result.source = tmpTypeSource;

  // **** Fourth Step: Get Conversion Function ****
  result.bpConv_BPFromCpp = genBPConvertFromRawType(type);
  result.bpConv_CppFromBP = genBPConvertToRawType(type);

  // **** Fifth Step: Get Conversion Decl Type ****
  // some types are different during decl type
  // default DeclType: is result.name
  const originalConvDeclType_BPFromCpp =
    map_convdecltype_cpp2bp[type.source] ?? result.name;

  result.bpConvDeclType_BPFromCpp = genConvDeclType_WithSpecialDeclTypeRule(
    originalConvDeclType_BPFromCpp
  );

  // default DeclType: is type.name
  const originalConvDeclType_CppFromBP =
    map_convdecltype_bp2cpp[type.source] ?? type.name;
  result.bpConvDeclType_CppFromBP = genConvDeclType_WithSpecialDeclTypeRule(
    originalConvDeclType_CppFromBP
  );

  return result;
}

// struct - member variable: default value
export type BPDictInitializer = { [paramName: string]: ConstructorInitializer };

export function getBPMemberVariableDefaultValue(
  dictStructInitializer: BPDictInitializer,
  member_variable: MemberVariable
): [boolean, string] {
  let bNeedDefaultValue = false;
  let valDefaultVal = undefined;

  // TBD if there is no default constructor
  if (dictStructInitializer[member_variable.name]) {
    bNeedDefaultValue = true;
    // [TBD]
    valDefaultVal = dictStructInitializer[member_variable.name].values[0];

    let cpp_type = dictStructInitializer[member_variable.name]?.type;
    let cpp_type_without_namespace = Tools.convertTypeNameToNodeName(cpp_type);
    let enum_val = BPHelper.getMapCpp2BPEnum().get(cpp_type_without_namespace);
    if (enum_val) {
      valDefaultVal =
        `${AGORA_MUSTACHE_DATA.UABTEnum_WrapWithUE}(` +
        dictStructInitializer[member_variable.name].values[0] +
        ')';
      bNeedDefaultValue = true;
    }
  }

  if (valDefaultVal === undefined) {
    let cpp_type = dictStructInitializer[member_variable.name]?.type;
    let cpp_type_without_namespace = Tools.removeNamespace(cpp_type);
    if (
      cpp_type_without_namespace &&
      map_cpptype_default_value[cpp_type_without_namespace]
    ) {
      valDefaultVal = map_cpptype_default_value[cpp_type_without_namespace];
      bNeedDefaultValue = true;
    }
  }

  if (valDefaultVal === undefined) {
    let cpp_type_without_namespace = Tools.removeNamespace(
      member_variable.type.source
    );
    if (
      cpp_type_without_namespace &&
      map_cpptype_default_value[cpp_type_without_namespace]
    ) {
      valDefaultVal = map_cpptype_default_value[cpp_type_without_namespace];
      bNeedDefaultValue = true;
    }
  }

  if (valDefaultVal === undefined) {
    let cpp_type_without_namespace = Tools.convertTypeNameToNodeName(
      member_variable.type.source
    );
    let enum_val = BPHelper.getMapCpp2BPEnum().get(cpp_type_without_namespace);
    if (enum_val) {
      valDefaultVal = `(${AGORA_MUSTACHE_DATA.UABTEnum_WrapWithUE}((int)0))`;
      bNeedDefaultValue = true;
    }
  }

  if (valDefaultVal === undefined) {
    let cpp_type_without_namespace = Tools.convertTypeNameToNodeName(
      member_variable.type.source
    );
    if (
      BPHelper.getMapCpp2BPClass().has(cpp_type_without_namespace) ||
      BPHelper.getMapCpp2BPStruct().has(cpp_type_without_namespace)
    ) {
      bNeedDefaultValue = false;
    }
  }

  if (valDefaultVal === undefined) {
    if (member_variable.type.name == 'Optional') {
      bNeedDefaultValue = false;
    }
  }

  if (valDefaultVal === undefined) {
    let [bIsArray, original_type] = parseArrayType(member_variable.type.source);
    console.log(
      member_variable.type.source,
      'getBPMemberVariableDefaultValue',
      bIsArray,
      original_type
    );
    if (bIsArray) {
      bNeedDefaultValue = false;
    }
  }

  if (valDefaultVal === undefined) {
    valDefaultVal = 'Unknown_TBD';
  }

  return [bNeedDefaultValue, valDefaultVal];
}

export function getMethod_NativePtr(node_method: MemberFunction): string {
  return map_native_ptr_name[node_method.parent_name] ?? '';
}

export type ClazzAddtionalContext = ClazzAddtionalContext_;
export function getContext_BPClass(clazz_name: string): ClazzAddtionalContext_ {
  return map_class_initialization[clazz_name];
}

// ********** Special Decl Type Rule **********

function checkNeedApplySpecialDeclTypeRule(val: string): boolean {
  return Object.values(SpecialDeclTypeRule).includes(
    val as SpecialDeclTypeRule
  );
}

function genConvDeclType_WithSpecialDeclTypeRule(
  val: string
): ConvDeclTypeData {
  let result = new ConvDeclTypeData();
  result.convDeclType = val;
  if (!checkNeedApplySpecialDeclTypeRule(val)) {
    return result;
  }

  // Apply Special Rule
  result.enableSpecialRule = true;
  const rule = val as SpecialDeclTypeRule;
  if (rule === SpecialDeclTypeRule.RULE_STR_BP2CPP) {
    // decl: std::string a = TCHAR_TO_UTF8(*b);
    // usage: a.c_str();
    // free: none
    result.specialRuleConvType = ConversionWayType.CppFromBP_NeedCallConvFunc;
    result.convDeclType = 'std::string';
    result.convFunc = 'TCHAR_TO_UTF8';
    result.needDereference = true;
    result.useMemberFunc = '.c_str()';
  } else if (rule === SpecialDeclTypeRule.RULE_STR_CPP2BP) {
    // decl: FString a = UTF8_TO_TCHAR(b);
    // usage: a;
    // free: none
    result.specialRuleConvType = ConversionWayType.CppFromBP_NeedCallConvFunc;
    result.convDeclType = 'FString';
    result.convFunc = 'UTF8_TO_TCHAR';
    result.needDereference = false;
    result.useMemberFunc = '';
  } else if (rule === SpecialDeclTypeRule.RULE_FVECTOR_BP2CPP) {
    // decl: float[3] a; UABT::SetFloatArray(b,a,3);
    // usage: a;
    // free: none
    result.specialRuleConvType = ConversionWayType.CppFromBP_SetData;
    result.convDeclType = 'float[3]';
    result.convFunc = 'UABT::SetFloatArray';
    result.needDereference = false;
    result.useMemberFunc = '';
    result.numSetDataSize = '';
  } else if (rule === SpecialDeclTypeRule.RULE_FVECTOR_CPP2BP) {
    // decl: FVector a = UABT::FromFloatArray(b);
    // usage: a;
    // free: none
    result.specialRuleConvType = ConversionWayType.CppFromBP_NeedCallConvFunc;
    result.convDeclType = 'FVector';
    result.convFunc = 'UABT::FromFloatArray';
    result.needDereference = false;
    result.useMemberFunc = '';
  }
  return result;
}

// ********** End of Special Decl Type Rule **********
