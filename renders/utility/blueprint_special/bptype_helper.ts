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
  map_bp2cpp_convert_function_name,
  map_bp2cpp_memory_handle,
  map_cpp2bp_convert_function_name,
  map_cpptype_2_uebptype,
  map_cpptype_default_value,
  map_native_ptr_name,
  map_setdata_function_name,
} from './bptype_data';

export enum ConvWayType_BPFromCpp {
  // BP = FuncFrom(Cpp);
  NoNeedConversion, // no need conversion
  Basic, // need basic conversion method
  // Example: CreateRawData()
  NeedCallConvFunc, // need call conversion function
}

export enum ConvWayType_CppFromBP {
  // Cpp = FuncTo(BP);
  NoNeedConversion, // no need conversion
  Basic, // need basic conversion method
  NewFreeData, // need memory allocation
  SetData, // directly set data
}

export class UEBPType {
  cppTypeName: string;
  cppTypeSource: string;
  cppTypeNameWithoutNamespace: string;
  cppTypeSourceWithoutNamespace: string;

  // BP
  name: string; // [bpTypeName] type name of blueprint: Ex. FString
  source: string; // [bpTypeSource] type with full qualifier: Ex. const FString &

  // bp = FuncFrom(cpp);
  bpNeedConvFunc_BPFromCpp: boolean;
  bpConvWayType_BPFromCpp: ConvWayType_BPFromCpp;
  bpNameConvFunc_BPFromCpp: string;

  // cpp = FuncTo(bp);
  bpNeedConvFunc_CppFromBP: boolean;
  bpConvWayType_CppFromBP: ConvWayType_CppFromBP;
  bpNameConvFunc_CppFromBP: string;
  // Example:
  // bpNameConvFunc_BPFromCpp [NewRawData]
  // bpNameConvFuncAdditional_BPFromCpp: [FreeRawData]
  bpNameConvFuncAdditional_CppFromBP: string;

  constructor() {
    this.cppTypeName = '';
    this.cppTypeSource = '';
    this.cppTypeNameWithoutNamespace = '';
    this.cppTypeSourceWithoutNamespace = '';

    this.name = '';
    this.source = '';

    this.bpNeedConvFunc_BPFromCpp = false;
    this.bpConvWayType_BPFromCpp = ConvWayType_BPFromCpp.NoNeedConversion;
    this.bpNameConvFunc_BPFromCpp = '';
    this.bpNameConvFuncAdditional_CppFromBP = '';

    this.bpNeedConvFunc_CppFromBP = false;
    this.bpConvWayType_CppFromBP = ConvWayType_CppFromBP.NoNeedConversion;
    this.bpNameConvFunc_CppFromBP = '';
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
        bpNeedConvFunc_BPFromCpp: ${this.bpNeedConvFunc_BPFromCpp}
        bpConvWayType_BPFromCpp: ${
          ConvWayType_BPFromCpp[this.bpConvWayType_BPFromCpp]
        }
        bpNameConvFunc_BPFromCpp: "${this.bpNameConvFunc_BPFromCpp}"

        // Conversion from BP to C++:
        bpNeedConvFunc_CppFromBP: ${this.bpNeedConvFunc_CppFromBP}
        bpConvWayType_CppFromBP: ${
          ConvWayType_CppFromBP[this.bpConvWayType_CppFromBP]
        }
        bpNameConvFunc_CppFromBP: "${this.bpNameConvFunc_CppFromBP}"
        bpNameConvFuncAdditional_CppFromBP: "${
          this.bpNameConvFuncAdditional_CppFromBP
        }"
    }`;
  }
}

type ConversionWayType = ConvWayType_BPFromCpp | ConvWayType_CppFromBP;

class CppBPConversionData {
  convNeeded: boolean;
  convFuncType: ConversionWayType;
  convFunc: string;
  convFuncAdditional01: string; // Ex. free data conv function

  constructor() {
    this.convNeeded = false;
    this.convFuncType = ConvWayType_BPFromCpp.NoNeedConversion;
    this.convFunc = '';
    this.convFuncAdditional01 = '';
  }
}

function genBPConvertFromRawType(type: SimpleType): CppBPConversionData {
  // bp = Func(cpp);
  let conversion = new CppBPConversionData();

  // Enum
  let nodeName = Tools.convertTypeNameToNodeName(type.name);
  let [typeCategory, bpTypeName] = BPHelper.getRegisteredBPType(nodeName);
  if (typeCategory == CXXTYPE.Enumz) {
    conversion = {
      convNeeded: true,
      convFuncType: ConvWayType_BPFromCpp.Basic,
      convFunc: 'UABTEnum::WrapWithUE',
      convFuncAdditional01: '',
    };
  }

  let convert_function = map_cpp2bp_convert_function_name[type.source];
  if (convert_function) {
    conversion = {
      convNeeded: true,
      convFuncType: ConvWayType_BPFromCpp.Basic,
      convFunc: convert_function,
      convFuncAdditional01: '',
    };
  } else {
  }

  return conversion;
}

function genBPConvertToRawType(type: SimpleType): CppBPConversionData {
  // cpp = Func(bp);
  let conversion = new CppBPConversionData();
  // UEnum
  let nodeName = Tools.convertTypeNameToNodeName(type.name);
  let [typeCategory, bpTypeName] = BPHelper.getRegisteredBPType(nodeName);
  if (typeCategory == CXXTYPE.Enumz) {
    conversion = {
      convNeeded: true,
      convFuncType: ConvWayType_CppFromBP.Basic,
      convFunc: 'UABTEnum::ToRawValue',
      convFuncAdditional01: '',
    };
  }

  let convert_function = map_bp2cpp_convert_function_name[type.name];
  if (convert_function) {
    conversion = {
      convNeeded: true,
      convFuncType: ConvWayType_CppFromBP.Basic,
      convFunc: convert_function,
      convFuncAdditional01: '',
    };
  } else {
    let func_memorys = map_bp2cpp_memory_handle[type.name];
    if (func_memorys) {
      conversion = {
        convNeeded: true,
        convFuncType: ConvWayType_CppFromBP.NewFreeData,
        convFunc: func_memorys[0], // New Data
        convFuncAdditional01: func_memorys[1], // Free Data
      };
    } else {
      let set_data_func = map_setdata_function_name[type.name];
      if (set_data_func) {
        conversion = {
          convNeeded: true,
          convFuncType: ConvWayType_CppFromBP.SetData,
          convFunc: set_data_func,
          convFuncAdditional01: '',
        };
      }
    }
  }
  return conversion;
}

// TBD(WinterPu) - TArray<char>
// 函数：检查字符串是否为数组类型，并返回类型名或原始类型
export function parseArrayType(typeString: string): [boolean, string] {
  // 匹配格式为 typeName[n] 或 typeName[] 的字符串
  const regex = /^(.*?)(\[\d+\]|\[\])$/;
  const match = regex.exec(typeString);

  // 如果匹配成功，返回 true 和类型名
  if (match) {
    return [true, match[1]]; // match[1] 是去掉数组标记后的类型名
  }

  // 如果不匹配，返回 false 和原始类型
  return [false, typeString];
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
    let nodeName = Tools.convertTypeNameToNodeName(type.name);
    let [typeCategory, bpTypeNameTmp] = BPHelper.getRegisteredBPType(nodeName);

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
  let [isArray, arrayType] = parseArrayType(type.source);
  if (isArray) {
    tmpTypeSource = 'TArray<' + arrayType + '>';
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
  const convBPFromCpp = genBPConvertFromRawType(type);
  const convBPToCpp = genBPConvertToRawType(type);

  result.bpNeedConvFunc_BPFromCpp = convBPFromCpp.convNeeded;
  result.bpConvWayType_BPFromCpp =
    convBPFromCpp.convFuncType as ConvWayType_BPFromCpp;
  result.bpNameConvFunc_BPFromCpp = convBPFromCpp.convFunc;

  result.bpNeedConvFunc_CppFromBP = convBPToCpp.convNeeded;
  result.bpConvWayType_CppFromBP =
    convBPToCpp.convFuncType as ConvWayType_CppFromBP;
  result.bpNameConvFunc_CppFromBP = convBPToCpp.convFunc;
  result.bpNameConvFuncAdditional_CppFromBP = convBPToCpp.convFuncAdditional01;

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
        'UABT::WrapWithUE(' +
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
      valDefaultVal = 'UABT::WrapWithUE((int)0)';
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
