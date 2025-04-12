import path from 'path';

import {
  CXXFile,
  CXXTYPE,
  CXXTerraNode,
  Clazz,
  MemberFunction,
  MemberVariable,
  SimpleType,
  Struct,
  Variable,
} from '@agoraio-extensions/cxx-parser';

import * as CppHelper from '../cpp_helper';
import * as Logger from '../logger';

import * as Tools from '../tools';

import {
  BPMethodContext,
  BPParamContext,
  BPStructContext,
} from './bpcontext_data';

import {
  ConversionWayType,
  DeclTypeSPRule,
  map_bptype_conv_data,
  map_decltype_special_rule,
  map_struct_member_variable_size_count,
} from './bptype_data_conv';
import { UEBPType } from './bptype_helper';

import * as BPTypeHelper from './bptype_helper';
import { AGORA_MUSTACHE_DATA } from './bptype_mustache_data';

export function getIncludeFilesForBP(cxxFile: CXXFile): string[] {
  let includeFiles: string[] = [];
  cxxFile.nodes.forEach((node: CXXTerraNode) => {
    if (node.__TYPE == CXXTYPE.IncludeDirective) {
      let inc_dir = node.asIncludeDirective();
      const filename = Tools.extractFileName(inc_dir.include_file_path) ?? '';
      if (mapFileName2BPName.has(filename)) {
        const bp_filename = mapFileName2BPName.get(filename) ?? '';
        const ext_name = path.extname(inc_dir.include_file_path);
        includeFiles.push(`#include "${bp_filename}${ext_name}"`);
      }
    }
  });
  return includeFiles;
}

// get custom defined bp types in conv map: Ex. UABT_Opt_int
export function getCustomDefinedBPTypes_InConvMap(): { [key: string]: string } {
  const customTypes: { [key: string]: string } = {};
  for (const typeName in map_bptype_conv_data) {
    const typeData = map_bptype_conv_data[typeName];
    if (typeData.isCustomBPType === true) {
      customTypes[typeName] = typeData.bpTypeName;
    }
  }
  return customTypes;
}

export function genBPReturnType(return_type: SimpleType): string {
  let isReturnType = true;
  let options: BPTypeHelper.AnalysisOptions = {
    isAgoraType: isAgoraClassType(return_type),
  };

  const bp_type = BPTypeHelper.convertToBPType(
    return_type,
    undefined,
    isReturnType,
    options
  );
  return bp_type.source;
}

export function genBPParameterType(
  return_type: SimpleType,
  is_output?: boolean
): UEBPType {
  return BPTypeHelper.convertToBPType(return_type, is_output);
}

export function genBPMethodName(method_name: string): string {
  if (!method_name) return method_name; // handle empty string
  return method_name.charAt(0).toUpperCase() + method_name.slice(1);
}

const bp_multicast_number_prefix: string[] = [
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
];

export function genbpCallbackDelegateMacroName(len_params: number): string {
  if (len_params > 9) {
    Logger.PrintError(`Error: Invalid number of parameters: ${len_params}`);
    return 'NoDelegate';
  } else if (len_params == 0) {
    return 'DECLARE_DYNAMIC_MULTICAST_DELEGATE';
  } else if (len_params == 1) {
    return 'DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam';
  } else {
    return `DECLARE_DYNAMIC_MULTICAST_DELEGATE_${
      bp_multicast_number_prefix[len_params - 1]
    }Params`;
  }
}

export function genbpCallbackDelegateTypeName(method_name: string): string {
  let BPMethodName = genBPMethodName(method_name);
  return `F${BPMethodName}`;
}

export function genbpCallbackDelegateVarName(method_name: string): string {
  let BPMethodName = genBPMethodName(method_name);
  return `${BPMethodName}`;
}

export function getBPType(type: SimpleType): UEBPType {
  return BPTypeHelper.convertToBPType(type);
}

// About BP Name
const mapFileName2BPName: Map<string, string> = new Map();
const mapCpp2BPClass: Map<string, string> = new Map();
const mapCpp2BPStruct: Map<string, string> = new Map();
const mapCpp2BPEnum: Map<string, string> = new Map();

export function getMapFileName2BPName(): Map<string, string> {
  return mapFileName2BPName;
}

export function getMapCpp2BPClass(): Map<string, string> {
  return mapCpp2BPClass;
}

export function getMapCpp2BPStruct(): Map<string, string> {
  return mapCpp2BPStruct;
}

export function getMapCpp2BPEnum(): Map<string, string> {
  return mapCpp2BPEnum;
}

export function isAgoraClassType(type: SimpleType): boolean {
  // TBD(WinterPu):
  // Custom Header would add namespace ext Ex. agora::rtc::ext::AudioDeviceInfo
  // Notice: AudioDeviceInfo is defined in custom headers
  return type.name.toLowerCase().includes('::ext::');
}

export function initMapRegisteredData() {
  mapCpp2BPClass.clear();
  mapCpp2BPStruct.clear();
  mapCpp2BPEnum.clear();
  mapFileName2BPName.clear();
}

export function registerBPNameForAgora_Class(
  clazz_name: string,
  bp_name: string
) {
  mapCpp2BPClass.set(clazz_name, bp_name);
}

export function registerBPNameForAgora_Struct(
  struct_name: string,
  bp_name: string
) {
  mapCpp2BPStruct.set(struct_name, bp_name);
}

export function registerBPNameForAgora_Enum(
  enum_name: string,
  bp_name: string
) {
  mapCpp2BPEnum.set(enum_name, bp_name);
}

export function registerBPFileName(file_name: string, bp_filename: string) {
  mapFileName2BPName.set(file_name, bp_filename);
}

export function registerBPNameForSelfDefinedType() {
  const map_bptypes_custom_defined_in_conv_map =
    getCustomDefinedBPTypes_InConvMap();

  for (const [key_cpp, value_bp] of Object.entries(
    map_bptypes_custom_defined_in_conv_map
  )) {
    mapCpp2BPStruct.set(key_cpp, value_bp);
  }
}

export function genBPNameForAgora_Class(clazz_name: string): string {
  // legency issue
  // Because the design previously removed the leading 'I'.
  // ex. IRtcEngine => UAgoraBPuRtcEngine
  // TBD(WinterPu)
  // Ex. like Iterator, Interface, etc. Which the leading 'I' is not removed.
  if (clazz_name.startsWith('I')) {
    clazz_name = clazz_name.slice(1); // 去掉开头的 I
  }
  return AGORA_MUSTACHE_DATA.UEBP_PREFIX_CLASS + clazz_name;
}

export function genBPNameForAgora_Struct(struct_name: string): string {
  return AGORA_MUSTACHE_DATA.UEBP_PREFIX_STRUCT + struct_name;
}

export function genBPNameForAgora_Enum(enum_name: string): string {
  return AGORA_MUSTACHE_DATA.UEBP_PREFIX_ENUM + enum_name;
}

export function genBPFileName(file_name: string): string {
  let res_name = file_name;
  if (res_name.startsWith('I')) {
    res_name = res_name.slice(1); // 去掉开头的 I
  }
  return AGORA_MUSTACHE_DATA.BPFileName_Prefix + res_name;
}

export function getRegisteredBPSearchKey(node: CXXTerraNode): string {
  let search_key = node.name ?? '';
  if (node.__TYPE === CXXTYPE.SimpleType) {
    if (search_key.includes('Optional')) {
      search_key = node.source;
    }
    search_key = Tools.convertTypeNameToNodeName(search_key);
  }
  return search_key;
}
export function getRegisteredBPType(node_name: string): [CXXTYPE, string] {
  let typeCategory = CXXTYPE.Unknown;
  let bpTypeName = node_name;

  if (mapCpp2BPClass.has(node_name)) {
    typeCategory = CXXTYPE.Clazz;
    bpTypeName = mapCpp2BPClass.get(node_name) ?? node_name;
  } else if (mapCpp2BPStruct.has(node_name)) {
    typeCategory = CXXTYPE.Struct;
    bpTypeName = mapCpp2BPStruct.get(node_name) ?? node_name;
  } else if (mapCpp2BPEnum.has(node_name)) {
    typeCategory = CXXTYPE.Enumz;
    bpTypeName = mapCpp2BPEnum.get(node_name) ?? node_name;
  }

  return [typeCategory, bpTypeName];
}

export function prepareBPStructInitializerDict(
  node_struct: Struct
): BPTypeHelper.BPDictInitializer {
  const dict_variable_initializer: BPTypeHelper.BPDictInitializer = {};

  node_struct.constructors.map((constructor, index) => {
    if (constructor.parameters.length == 0) {
      //default constructor
      constructor.initializerList.map((initializer) => {
        dict_variable_initializer[initializer.name] = initializer;
      });
    }
  });

  return dict_variable_initializer;
}

export function getBPStructData_DefaultVal(
  dict_variable_initializer: BPTypeHelper.BPDictInitializer,
  member_variable: MemberVariable,
  bpType: UEBPType
): string {
  let bNeedDefaultVal = false;
  let defaultVal = '';
  let outputfomatDefaultVal = '';

  [bNeedDefaultVal, defaultVal] = BPTypeHelper.getBPMemberVariableDefaultValue(
    dict_variable_initializer,
    member_variable,
    bpType
  );

  // TBD(WinterPu) some default values are not matched with UE Type
  // Ex. FString Var = 0;

  if (bNeedDefaultVal) {
    outputfomatDefaultVal = `= ${defaultVal}`;
  }

  return outputfomatDefaultVal;
}

export function genContext_BPStruct(
  node_struct: Struct,
  prefix_indent: string = ''
): BPStructContext {
  let contextConstructor = '';
  let contextCreateRawData = '';
  let contextFreeRawData = '';

  const addOneLineFunc = function (line: string): string {
    return Tools.addOneLine_Format(line, prefix_indent);
  };

  // [Step 01] Begin
  // Ex. {{{fullName}}} AgoraData;
  contextCreateRawData += addOneLineFunc(
    `${node_struct.fullName} ${AGORA_MUSTACHE_DATA.AGORA_DATA};`
  );

  node_struct.member_variables.map((member_variable, index) => {
    let type = member_variable.type;
    let struct_full_name = member_variable?.parent?.fullName ?? '';
    let bpType = BPTypeHelper.convertToBPType(type);
    const var_SizeCount = getBPSizeCount(node_struct, member_variable);
    const conv_bpfromcpp = bpType.bpConv_BPFromCpp;
    const conv_cppfrombp = bpType.bpConv_CppFromBP;
    const macro_scope_start =member_variable.user_data?.macro_scope_start;
    const macro_scope_end = member_variable.user_data?.macro_scope_end;
    if (
      Tools.IsNotEmptyStr(macro_scope_start) &&
      Tools.IsNotEmptyStr(macro_scope_end)
    ) {
      contextConstructor += addOneLineFunc(`${macro_scope_start}`);
      contextCreateRawData += addOneLineFunc(`${macro_scope_start}`);
    }

    // **** Constructor Context ****
    if (conv_bpfromcpp.convFuncType !== ConversionWayType.NoNeedConversion) {
      if (
        conv_bpfromcpp.convFuncType ===
        ConversionWayType.BPFromCpp_NewFreeArrayData
      ) {
        // Ex. UABT::SetBPArrayData<agora::rtc::FocalLengthInfo, FUABT_FocalLengthInfo>(focalLengthInfos);
        contextConstructor += addOneLineFunc(
          `${conv_bpfromcpp.convFunc}<${type.name}, ${bpType.name}>(this->${member_variable.name}, ${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name},${var_SizeCount});`
        );
      } else {
        // Basic Conversion
        contextConstructor += addOneLineFunc(
          `this->${member_variable.name} = ${conv_bpfromcpp.convFunc}(${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name});`
        );
      }
    } else {
      // No Need Conversion
      contextConstructor += addOneLineFunc(
        `this->${member_variable.name} = ${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name};`
      );
    }

    // **** CreateRawData Context ****
    if (conv_cppfrombp.convFuncType !== ConversionWayType.NoNeedConversion) {
      if (
        conv_cppfrombp.convFuncType === ConversionWayType.Basic ||
        conv_cppfrombp.convFuncType === ConversionWayType.CppFromBP_NewFreeData
      ) {
        // Ex. AgoraData.{{name}} = {{user_data.bpNameConvFuncFrom}}({{name}});
        contextCreateRawData += addOneLineFunc(
          `${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name} = ${conv_cppfrombp.convFunc}(${member_variable.name});`
        );
      } else if (
        conv_cppfrombp.convFuncType ===
        ConversionWayType.CppFromBP_NewFreeArrayData
      ) {
        // Ex. 	agora::rtc::FocalLengthInfo* focalLengthInfo = UABT::New_RawDataArray<agora::rtc::FocalLengthInfo, FUABT_FocalLengthInfo>(focalLengthInfos);

        //TBD(WinterPu) use inline function to replace macro functions
        contextCreateRawData += addOneLineFunc(
          `${conv_cppfrombp.convFunc}<${type.name}, ${bpType.name}>(${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name},${var_SizeCount},${member_variable.name});`
        );
      } else if (
        conv_cppfrombp.convFuncType === ConversionWayType.CppFromBP_SetData
      ) {
        // Ex. {{user_data.bpNameConvFuncFrom}}(AgoraData.{{name}}, this->{{name}}, XXXFUABT_UserInfo_UserAccountLength);
        // TBD(WinterPu): need to check the length of the variable
        contextCreateRawData += addOneLineFunc(
          `${conv_cppfrombp.convFunc}}(${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name}, this->${member_variable.name}, ${var_SizeCount});`
        );
      } else if (
        conv_cppfrombp.convFuncType ===
        ConversionWayType.CppFromBP_NeedCallConvFunc
      ) {
        // Ex. AgoraData.{{name}} = {{name}}.CreateRawData();
        contextCreateRawData += addOneLineFunc(
          `${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name} = ${member_variable.name}.${conv_cppfrombp.convFunc}();`
        );
      } else if (
        conv_cppfrombp.convFuncType ===
        ConversionWayType.CppFromBP_CreateFreeOptData
      ) {
        // Ex. AgoraData.{{name}} = {{name}}.CreateRawOptData();
        contextCreateRawData += addOneLineFunc(
          `${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name} = ${member_variable.name}.${AGORA_MUSTACHE_DATA.CREATE_RAW_OPT_DATA}();`
        );
      } else {
        if (mapCpp2BPStruct.has(type.name)) {
          // Is UStruct
          // Ex. AgoraData.{{name}} = {{name}}.CreateRawData();
          contextCreateRawData += addOneLineFunc(
            `${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name} = ${member_variable.name}.${AGORA_MUSTACHE_DATA.CREATE_RAW_DATA}();`
          );
        } else {
          // AgoraData.{{name}} = {{name}};
          contextCreateRawData += addOneLineFunc(
            `${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name} = ${member_variable.name};`
          );
        }
      }
    } else {
      // No Need Conversion
      contextCreateRawData += addOneLineFunc(
        `${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name} = ${member_variable.name};`
      );
    }

    // **** FreeRawData Context ****
    let tmpContextFreeRawData = '';
    if (
      conv_cppfrombp.convFuncType === ConversionWayType.CppFromBP_NewFreeData
    ) {
      // Ex. {{name}}.FreeRawData(AgoraData.{{name}});
      tmpContextFreeRawData += addOneLineFunc(
        `${conv_cppfrombp.convFuncAdditional01}(${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name});`
      );
    } else if (
      conv_cppfrombp.convFuncType ===
      ConversionWayType.CppFromBP_NewFreeArrayData
    ) {
      // Ex. UABT::Free_RawDataArray<agora::rtc::DownlinkNetworkInfo::PeerDownlinkInfo, FUABT_PeerDownlinkInfo>(AgoraData.peer_downlink_info, AgoraData.total_received_video_count);
      tmpContextFreeRawData += addOneLineFunc(
        `${conv_cppfrombp.convFuncAdditional01}<${type.name}, ${bpType.name}>(${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name},${var_SizeCount});`
      );
    } else if (
      conv_cppfrombp.convFuncType ===
      ConversionWayType.CppFromBP_NeedCallConvFunc
    ) {
      // Ex. {{name}}.FreeRawData(AgoraData.{{name}});
      tmpContextFreeRawData += addOneLineFunc(
        `${member_variable.name}.${conv_cppfrombp.convFuncAdditional01}(${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name});`
      );
    } else if (
      conv_cppfrombp.convFuncType ===
      ConversionWayType.CppFromBP_CreateFreeOptData
    ) {
      // Ex. FUABT_Opt_bool::FreeRawOptData(AgoraData.{{name}});
      tmpContextFreeRawData += addOneLineFunc(
        `${bpType.name}::${AGORA_MUSTACHE_DATA.FREE_RAW_OPT_DATA}(${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name});`
      );
    }

    if (mapCpp2BPStruct.has(type.name)) {
      // Ex. {{name}}.FreeRawData(AgoraData.{{name}});
      tmpContextFreeRawData += addOneLineFunc(
        `${member_variable.name}.${AGORA_MUSTACHE_DATA.FREE_RAW_DATA}(${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name});`
      );
    } else {
    }

    if (
      Tools.IsNotEmptyStr(macro_scope_start) &&
      Tools.IsNotEmptyStr(macro_scope_end)
    ) {
      contextConstructor += addOneLineFunc(`${macro_scope_end}`);
      contextCreateRawData += addOneLineFunc(`${macro_scope_end}`);
      if (tmpContextFreeRawData && tmpContextFreeRawData !== '') {
        contextFreeRawData += addOneLineFunc(`${macro_scope_start}`);
      }
    }
    if (tmpContextFreeRawData && tmpContextFreeRawData !== '') {
      contextFreeRawData += tmpContextFreeRawData;

      if (
        Tools.IsNotEmptyStr(macro_scope_start) &&
        Tools.IsNotEmptyStr(macro_scope_end)
      ) {
        contextFreeRawData += addOneLineFunc(`${macro_scope_end}`);
      }
    }
  });

  // Ex. return AgoraData;
  contextCreateRawData += addOneLineFunc(
    `return ${AGORA_MUSTACHE_DATA.AGORA_DATA};`
  );

  const result = new BPStructContext();
  result.contextConstructor = contextConstructor;
  result.contextCreateRawData = contextCreateRawData;
  result.contextFreeRawData = contextFreeRawData;

  return result;
}




function genContext_ConvDeclType(
  param : Variable,
  bpType: UEBPType,
  bIsCppFromBP: boolean,
): BPParamContext {
  const prefix_var_name = bIsCppFromBP ? AGORA_MUSTACHE_DATA.RAW_ : AGORA_MUSTACHE_DATA.UEBP_;
  const param_name = param.name;
  const decl_var_name = prefix_var_name + param_name;

  const addOneLineFunc = function (line: string): string {
    return Tools.addOneLine_Format(line, '');
  };

  function extractArraySizeFromType(bpType: UEBPType){
    return Tools.extractBracketNumber(bpType.source);
  }

  const data_conv = bIsCppFromBP ? bpType.bpConv_CppFromBP : bpType.bpConv_BPFromCpp;
  const decl_type =  bIsCppFromBP ? bpType.cppDeclType : bpType.declType;

  let result = new BPParamContext();
  // Default: DeclType A = B;
  result.contextDecl = `${decl_type} ${decl_var_name} = ${param_name};`;
  result.contextUsage = `${decl_var_name}`;
  result.contextFree = '';

   // [Step 01]: if it has special rule, directly use it
  if(bpType.bpConvDeclTypeSPRule !== DeclTypeSPRule.DefaultNoSP) {
    const full_data_rule = map_decltype_special_rule.get(bpType.bpConvDeclTypeSPRule);
    const data_rule = bIsCppFromBP ? full_data_rule?.CppFromBP : full_data_rule?.BPFromCpp;
    if(data_rule) {
      result.contextDecl = `${data_rule.funcDecl(decl_var_name, param_name)}`;
      result.contextUsage = `${data_rule.funcUsage(decl_var_name)}`;
      result.contextFree = `${data_rule.funcFree()}`;
    }
  }
  else if(data_conv.convFuncType !== ConversionWayType.NoNeedConversion) {
    // [Step 02]: Use Default Basic Conversion
    const str_conv_func = Tools.IsNotEmptyStr(data_conv.convFunc) ? data_conv.convFunc : '';
    const str_free_func = Tools.IsNotEmptyStr(data_conv.convFuncAdditional01) ? data_conv.convFuncAdditional01 : '';
    const convWayType = data_conv.convFuncType;
    
    // [Part - Decl]
    if (
      convWayType ===
        ConversionWayType.CppFromBP_NeedCallConvFunc ||
        convWayType ===
        ConversionWayType.CppFromBP_CreateFreeOptData
    ) {
      result.contextDecl = addOneLineFunc(
        `${decl_type} ${decl_var_name} =${param_name}.${str_conv_func}();`
      );
    } else if (
      convWayType === ConversionWayType.CppFromBP_SetData
    ) {
      let str_size = extractArraySizeFromType(bpType);
      str_size = Tools.IsNotEmptyStr(str_size) ? ', ' + str_size : '';
      result.contextDecl = addOneLineFunc(
        `${decl_type} ${decl_var_name}; ${str_conv_func}(${param_name},${decl_var_name}${str_size});`
      );
    } else {
      result.contextDecl = addOneLineFunc(
        `${decl_type} ${decl_var_name} = ${str_conv_func}(${param_name});`
      );
    }

    // [Part - Usage]
    result.contextUsage = addOneLineFunc(`${decl_var_name}`);

    // [Part - Free]
    if (str_free_func !== '') {
      if (
        convWayType === ConversionWayType.CppFromBP_NewFreeData
      ) {
        result.contextFree = addOneLineFunc(
          `${str_free_func}(${decl_var_name});` 
        );
      } else if (
        convWayType ===
        ConversionWayType.CppFromBP_NeedCallConvFunc
      ) {
        result.contextFree = addOneLineFunc(`${param_name}.${str_free_func}(${decl_var_name});`);
      } else if (
        convWayType ===
        ConversionWayType.CppFromBP_CreateFreeOptData
      ) {
        const bpTypeName = bpType.name;
        result.contextFree = addOneLineFunc(`${bpTypeName}::${str_free_func}(${decl_var_name});`);
      }
    }
  }

  return result;
}


export function genContext_BPMethod(
  node_method: MemberFunction,
  prefix_indent: string = ''
): BPMethodContext {

  const addOneLineFunc = function (line: string): string {
    return Tools.addOneLine_Format(line, prefix_indent);
  };

  // Example:

  // decl: std::string a = TCHAR_TO_UTF8(*b);
  // usage: a.c_str();
  // free: none
  let contextParam_BPFromCpp = new BPParamContext();

  // decl: FString a = UTF8_TO_TCHAR(b);
  // usage: a;
  // free: none
  let contextParam_CppFromBP = new BPParamContext();

  let result = new BPMethodContext();

  node_method.parameters.map((param, index) => {
    const bptype = BPTypeHelper.convertToBPType(param.type);

    contextParam_BPFromCpp = genContext_ConvDeclType(
      param,
      bptype,
      false,
    );

    contextParam_CppFromBP = genContext_ConvDeclType(
      param,
      bptype,
      true,
    );

    // Usage
    const param_delimiter =
      index == node_method.parameters.length - 1 ? '' : ', ';

    // BP From Cpp
    // Decl
    result.contextParam_BPFromCpp.contextDecl += addOneLineFunc(
      contextParam_BPFromCpp.contextDecl
    );

    // Usage
    result.contextParam_BPFromCpp.contextUsage += `${contextParam_BPFromCpp.contextUsage}${param_delimiter}`;

    // Free
    result.contextParam_BPFromCpp.contextFree += addOneLineFunc(
      contextParam_BPFromCpp.contextFree
    );

    // Cpp From BP
    // Decl
    result.contextParam_CppFromBP.contextDecl += addOneLineFunc(
      contextParam_CppFromBP.contextDecl
    );

    // Usage
    result.contextParam_CppFromBP.contextUsage += `${contextParam_CppFromBP.contextUsage}${param_delimiter}`;

    // Free
    result.contextParam_CppFromBP.contextFree += addOneLineFunc(
      contextParam_CppFromBP.contextFree
    );
  });

  return result;
}

export function genContext_BPMethod_NativePtr(
  node_method: MemberFunction,
  prefix_indent: string = ''
): string {
  return BPTypeHelper.getMethod_NativePtr(node_method);
}

export function genContext_BPClass(
  node_clazz: Clazz,
  prefix_indent: string = ''
): BPTypeHelper.ClazzAddtionalContext {
  // TBD(WinterPu):
  // 1. Impl prefix_indent
  return BPTypeHelper.getContext_BPClass(node_clazz.name);
}

export function getBPSizeCount(
  node_struct: Struct,
  target_member_var: MemberVariable
): string {
  const tar_var_name = target_member_var.name;

  if (target_member_var.fullName in map_struct_member_variable_size_count) {
    return map_struct_member_variable_size_count[target_member_var.fullName];
  }

  for (const one_var of node_struct.asStruct().member_variables) {
    if (
      one_var.name == tar_var_name + 'Size' ||
      one_var.name == tar_var_name + 'Count'
    ) {
      return one_var.name;
    }
  }

  const type_size_count = Tools.extractBracketNumber(
    target_member_var.type.source
  );

  if (Tools.IsNotEmptyStr(type_size_count)) {
    return type_size_count;
  }

  Logger.PrintError(
    `Unknown size count variable for ${target_member_var.fullName}`
  );

  // TBD(WinterPu):
  // FUABT_ChannelMediaRelayConfiguration.srcInfo should be pointer rather than array
  return '1';
}
