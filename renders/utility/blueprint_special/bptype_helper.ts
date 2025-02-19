import { ConstructorInitializer, CXXTYPE, MemberVariable, SimpleType } from '@agoraio-extensions/cxx-parser/src/cxx_terra_node';

import * as Logger from '../logger';

import * as Tools from '../tools';

import { map_cpp2bp_convert_function_name, map_cpptype_2_uebptype, map_bp2cpp_convert_function_name, map_bp2cpp_memory_handle, map_setdata_function_name, map_cpptype_default_value } from './bptype_data';

import * as BPHelper from './bp_helper';

export enum BPConvFromCppWayType {
  // BP = FuncFrom(Cpp);
  NoNeedConversion, // no need conversion
  Basic, // need basic conversion method
  NewFreeData, // need memory allocation
  SetData, // directly set data
}

export enum BPConvToCppWayType {
  // Cpp = FuncTo(BP);
  NoNeedConversion, // no need conversion
  Basic, // need basic conversion method
  // Example: CreateRawData()
  NeedCallConvFunc, // need call conversion function
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
  bpNeedConvFuncFromCpp: boolean;
  bpConvFromCppWayType: BPConvFromCppWayType;
  bpNameConvFuncFrom: string;
  // Example: 
  // bpNameConvFuncFrom [NewRawData] 
  // bpNameConvFuncFromAdditional: [FreeRawData]
  bpNameConvFuncFromAdditional: string; 


  // cpp = FuncTo(bp);
  bpNeedConvFuncToCpp: boolean;
  bpConvToCppWayType: BPConvToCppWayType;
  bpNameConvFuncTo: string;

  constructor() {
    this.cppTypeName = '';
    this.cppTypeSource = '';
    this.cppTypeNameWithoutNamespace = '';
    this.cppTypeSourceWithoutNamespace = '';

    this.name = '';
    this.source = '';

    this.bpNeedConvFuncFromCpp = false;
    this.bpConvFromCppWayType = BPConvFromCppWayType.NoNeedConversion;
    this.bpNameConvFuncFrom = '';
    this.bpNameConvFuncFromAdditional = '';

    this.bpNeedConvFuncToCpp = false;
    this.bpConvToCppWayType = BPConvToCppWayType.NoNeedConversion;
    this.bpNameConvFuncTo = '';
  }

  toString(): string {
    return `UEBPType {
        // C++ Type Info:
        cppTypeName: "${this.cppTypeName}"
        cppTypeSource: "${this.cppTypeSource}"
        cppTypeNameWithoutNamespace: "${this.cppTypeNameWithoutNamespace}"
        cppTypeSourceWithoutNamespace: "${this.cppTypeSourceWithoutNamespace}"

        // Blueprint Type Info:
        bpTypeName: "${this.name}"
        bpTypeSource: "${this.source}"

        // Conversion from C++ to BP:
        bpNeedConvFuncFromCpp: ${this.bpNeedConvFuncFromCpp}
        bpConvFromCppWayType: ${BPConvFromCppWayType[this.bpConvFromCppWayType]}
        bpNameConvFuncFrom: "${this.bpNameConvFuncFrom}"
        bpNameConvFuncFromAdditional: "${this.bpNameConvFuncFromAdditional}"

        // Conversion from BP to C++:
        bpNeedConvFuncToCpp: ${this.bpNeedConvFuncToCpp}
        bpConvToCppWayType: ${BPConvToCppWayType[this.bpConvToCppWayType]}
        bpNameConvFuncTo: "${this.bpNameConvFuncTo}"
    }`;
  }
}



type ConversionWayType = BPConvFromCppWayType | BPConvToCppWayType;

class CppBPConversionData {
    convNeeded: boolean;
    convFuncType: ConversionWayType;
    convFunc: string;
    convFuncAdditional01: string; // Ex. free data conv function
  
    constructor() {
      this.convNeeded = false;
      this.convFuncType = BPConvFromCppWayType.NoNeedConversion;
      this.convFunc = '';
      this.convFuncAdditional01 = '';
    }
}


function genBPConvertToRawType(type: SimpleType): CppBPConversionData {
    let conversion = new CppBPConversionData();
    // UEnum
    let nodeName = Tools.convertTypeNameToNodeName(type.name);
    let [typeCategory, bpTypeName] = BPHelper.getRegisteredBPType(nodeName);
    if (typeCategory == CXXTYPE.Enumz) {
      conversion = {
        convNeeded: true,
        convFuncType: BPConvToCppWayType.Basic,
        convFunc: 'UABTEnum::ToRawValue',
        convFuncAdditional01: '',
      };
    }
  
    let convert_function = map_bp2cpp_convert_function_name[type.name];
    if (convert_function) {
      conversion = {
        convNeeded: true,
        convFuncType: BPConvToCppWayType.Basic,
        convFunc: convert_function,
        convFuncAdditional01: '',
      };
    } else {
    
    }
    return conversion;
  }
  
 function genBPConvertFromRawType(type: SimpleType): CppBPConversionData {
    let conversion = new CppBPConversionData();
  
    // Enum
    let nodeName = Tools.convertTypeNameToNodeName(type.name);
    let [typeCategory, bpTypeName] = BPHelper.getRegisteredBPType(nodeName);
    if (typeCategory == CXXTYPE.Enumz) {
      conversion = {
        convNeeded: true,
        convFuncType: BPConvFromCppWayType.Basic,
        convFunc: 'UABTEnum::WrapWithUE',
        convFuncAdditional01: '',
      };
    }
  
    let convert_function = map_cpp2bp_convert_function_name[type.name];
    if (convert_function) {
      conversion = {
        convNeeded: true,
        convFuncType: BPConvFromCppWayType.Basic,
        convFunc: convert_function,
        convFuncAdditional01: '',
      };
    } else {
      let func_memorys = map_bp2cpp_memory_handle[type.name];
      if (func_memorys) {
        conversion = {
          convNeeded: true,
          convFuncType: BPConvFromCppWayType.NewFreeData,
          convFunc: func_memorys[0], // New Data
          convFuncAdditional01: func_memorys[1], // Free Data
        };
      } else {
        let set_data_func = map_setdata_function_name[type.name];
        if (set_data_func) {
          conversion = {
            convNeeded: true,
            convFuncType: BPConvFromCppWayType.SetData,
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
export function convertToBPType(type: SimpleType, isOutput?: boolean): UEBPType {

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
    if(Tools.isNullOrEmpty(tmpTypeName_DirectMappingResult)) {
      tmpTypeName_DirectMappingResult = map_cpptype_2_uebptype[type.name];
    }
    else if(Tools.isNullOrEmpty(tmpTypeName_DirectMappingResult)) {
        tmpTypeName_DirectMappingResult = map_cpptype_2_uebptype[Tools.removeNamespace(type.source)];
    }
    else if(Tools.isNullOrEmpty(tmpTypeName_DirectMappingResult)) {
        tmpTypeName_DirectMappingResult = map_cpptype_2_uebptype[Tools.removeNamespace(type.name)];
    }

    if(!Tools.isNullOrEmpty(tmpTypeName_DirectMappingResult)) {
        result.name = tmpTypeName_DirectMappingResult;
    }
    else{

        // Not Founded

        // **** Second Step: If failed, analyze the type ****
        // Try to get [bpTypeName]

        // Enum / Class / Struct's name is without namespace
        // type.name has namespace
        // TBD(WinterPu): 
        // 1. is it possible to have namespace in the middle[ex. Optional<agora::rtc::RtcConnection>]
        let nodeName = Tools.convertTypeNameToNodeName(type.name);
        let [typeCategory, bpTypeNameTmp] = BPHelper.getRegisteredBPType(nodeName);

        if(typeCategory != CXXTYPE.Unknown) {
            result.name = bpTypeNameTmp;
        }
        else{
            
            Logger.PrintError(`convertToBPType: No Conversion Mapping ${type.source}`);
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
            if(type.is_const) {
                tmpTypeSource = 'const ' + tmpTypeSource + ' &';
            }
        }
    }
    else{
        // const
        if(type.is_const) {
            tmpTypeSource = 'const ' + tmpTypeSource + ' &';
        }
    }

    result.source = tmpTypeSource;


    // **** Fourth Step: Get Conversion Function ****
    const convBPFromCpp = genBPConvertFromRawType(type);
    const convBPToCpp = genBPConvertToRawType(type);

    result.bpNeedConvFuncFromCpp = convBPFromCpp.convNeeded;
    result.bpConvFromCppWayType = convBPFromCpp.convFuncType as BPConvFromCppWayType;
    result.bpNameConvFuncFrom = convBPFromCpp.convFunc;
    result.bpNameConvFuncFromAdditional =  convBPFromCpp.convFuncAdditional01;

    result.bpNeedConvFuncToCpp = convBPToCpp.convNeeded;
    result.bpConvToCppWayType = convBPToCpp.convFuncType as BPConvToCppWayType;
    result.bpNameConvFuncTo = convBPToCpp.convFunc;

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

  if(valDefaultVal === undefined) {
    valDefaultVal = 'Unknown_TBD';
  }

  return [bNeedDefaultValue, valDefaultVal];
}