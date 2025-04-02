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
} from '@agoraio-extensions/cxx-parser';

import * as CppHelper from '../cpp_helper';
import * as Logger from '../logger';

import * as Tools from '../tools';

import {
  BPMethodContext,
  BPParamContext,
  BPStructContext,
} from './bpcontext_data';

import { ConversionWayType, UEBPType } from './bptype_helper';

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
): string {
  const bp_type = BPTypeHelper.convertToBPType(return_type, is_output);
  return bp_type.source;
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
  const map_conv_cpp2bp = BPTypeHelper.getConvMap_CppToBP();
  for (const [key_cpp, value_bp] of Object.entries(map_conv_cpp2bp)) {
    // Optional Value
    if (Tools.IsOptionalUABTType(value_bp)) {
      mapCpp2BPStruct.set(key_cpp, value_bp);
    }
  }
}

export function genBPNameForAgora_Class(clazz_name: string): string {
  // legency issue
  // Because the design previously removed the leading 'I'.
  // ex. IRtcEngine => UAgoraBPuRtcEngine
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
  member_variable: MemberVariable
): string {
  let bNeedDefaultVal = false;
  let defaultVal = '';
  let outputfomatDefaultVal = '';

  [bNeedDefaultVal, defaultVal] = BPTypeHelper.getBPMemberVariableDefaultValue(
    dict_variable_initializer,
    member_variable
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

  // Begin
  // Ex. {{{fullName}}} AgoraData;
  contextCreateRawData += addOneLineFunc(
    `${Tools.generateFullScopeName(node_struct)} ${
      AGORA_MUSTACHE_DATA.AGORA_DATA
    };`
  );

  node_struct.member_variables.map((member_variable, index) => {
    let type = member_variable.type;
    let bpType = BPTypeHelper.convertToBPType(type);
    const conv_bpfromcpp = bpType.bpConv_BPFromCpp;
    const conv_cppfrombp = bpType.bpConv_CppFromBP;
    let macro_scope_start =
      CppHelper.createCompilationDirectivesContent(member_variable);

    let macro_scope_end = CppHelper.createCompilationDirectivesContent(
      member_variable,
      false
    );

    if (
      Tools.IsNotEmptyStr(macro_scope_start) &&
      Tools.IsNotEmptyStr(macro_scope_end)
    ) {
      contextConstructor += addOneLineFunc(`${macro_scope_start}`);
      contextCreateRawData += addOneLineFunc(`${macro_scope_start}`);
    }

    // **** Constructor Context ****
    if (conv_bpfromcpp.convNeeded) {
      contextConstructor += addOneLineFunc(
        `this->${member_variable.name} = ${conv_bpfromcpp.convFunc}(${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name});`
      );
    } else {
      contextConstructor += addOneLineFunc(
        `this->${member_variable.name} = ${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name};`
      );
    }

    // **** CreateRawData Context ****
    if (conv_cppfrombp.convNeeded) {
      if (
        conv_cppfrombp.convFuncType === ConversionWayType.Basic ||
        conv_cppfrombp.convFuncType === ConversionWayType.CppFromBP_NewFreeData
      ) {
        // Ex. AgoraData.{{name}} = {{user_data.bpNameConvFuncFrom}}({{name}});
        contextCreateRawData += addOneLineFunc(
          `${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name} = ${conv_cppfrombp.convFunc}(${member_variable.name});`
        );
      } else if (
        conv_cppfrombp.convFuncType === ConversionWayType.CppFromBP_SetData
      ) {
        // Ex. {{user_data.bpNameConvFuncFrom}}(AgoraData.{{name}}, this->{{name}}, XXXFUABT_UserInfo_UserAccountLength);
        // TBD(WinterPu): need to check the length of the variable
        contextCreateRawData += addOneLineFunc(
          `${conv_cppfrombp.convFunc}}(${AGORA_MUSTACHE_DATA.AGORA_DATA}.${member_variable.name}, this->${member_variable.name}, XXXFUABT_UserInfo_UserAccountLength);`
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
  param_name: string,
  param_conv_prefix: string,
  default_conv: BPTypeHelper.CppBPConversionData,
  data: BPTypeHelper.ConvDeclTypeData
): BPParamContext {
  let param = new BPParamContext();

  let name_conv_var = param_conv_prefix + param_name;
  param.contextDecl = `${data.convDeclType} ${name_conv_var}= ${param_name};`;
  param.contextUsage = `${name_conv_var}`;
  param.contextFree = '';

  // default DeclType A = B;

  // [Step 01]: if it has special rule, directly use it
  if (data.enableSpecialRule) {
    // decl
    const str_dereference = data.needDereference ? '*' : '';
    const str_conv_func = data.convFunc ? data.convFunc : '';

    const str_name_param = `${str_dereference}${param_name}`;

    // usage
    const str_usage_postfix = data.useMemberFunc ? data.useMemberFunc : '';

    if (
      data.specialRuleConvType === ConversionWayType.CppFromBP_NeedCallConvFunc
    ) {
      param.contextDecl = `${data.convDeclType} ${name_conv_var} = ${str_conv_func}(${str_name_param});`;

      param.contextUsage = `${name_conv_var}${str_usage_postfix}`;
      param.contextFree = '';
    } else if (
      data.specialRuleConvType === ConversionWayType.CppFromBP_SetData
    ) {
      // Example: float[3] a; UABT::SetFloatArray(b,a);
      const str_num_setdata_size = data.numSetDataSize
        ? ', ' + data.numSetDataSize
        : '';
      param.contextDecl = `${data.convDeclType} ${name_conv_var}; ${str_conv_func}(${str_name_param},${name_conv_var}${str_num_setdata_size});`;

      param.contextUsage = `${name_conv_var}${str_usage_postfix}`;
      param.contextFree = '';
    }
  } else if (default_conv.convNeeded) {
    // [Step 02]: reference its default conv (used in parameters)
    const str_conv_func = default_conv.convFunc ? default_conv.convFunc : '';

    const str_free_func =
      default_conv.convFuncAdditional01 &&
      default_conv.convFuncAdditional01 !== ''
        ? default_conv.convFuncAdditional01
        : '';
    if (
      default_conv.convFuncType ===
        ConversionWayType.CppFromBP_NeedCallConvFunc ||
      default_conv.convFuncType ===
        ConversionWayType.CppFromBP_CreateFreeOptData
    ) {
      param.contextDecl = `${data.convDeclType} ${name_conv_var} =${param_name}.${str_conv_func}();`;
    } else if (
      default_conv.convFuncType === ConversionWayType.CppFromBP_SetData
    ) {
      const str_additional_size = default_conv.convAdditionalFuncParam01
        ? ', ' + default_conv.convAdditionalFuncParam01
        : '';
      param.contextDecl = `${data.convDeclType} ${name_conv_var}; ${str_conv_func}(${param_name},${name_conv_var}${str_additional_size});`;
    } else {
      param.contextDecl = `${data.convDeclType} ${name_conv_var} = ${str_conv_func}(${param_name});`;
    }

    param.contextUsage = `${name_conv_var}`;

    if (str_free_func && str_free_func !== '') {
      if (
        default_conv.convFuncType === ConversionWayType.CppFromBP_NewFreeData
      ) {
        param.contextFree = `${str_free_func}(${param_name});`;
      } else if (
        default_conv.convFuncType ===
        ConversionWayType.CppFromBP_NeedCallConvFunc
      ) {
        param.contextFree = `${param_name}.${str_free_func}(${AGORA_MUSTACHE_DATA.AGORA_DATA}.${param_name});`;
      } else if (
        default_conv.convFuncType ===
        ConversionWayType.CppFromBP_CreateFreeOptData
      ) {
        param.contextFree = `${default_conv.bpTypeName}::${str_free_func}(${AGORA_MUSTACHE_DATA.AGORA_DATA}.${param_name});`;
      }
    }
  }

  return param;
}

export function genContext_BPMethod(
  node_method: MemberFunction,
  prefix_indent: string = ''
): BPMethodContext {
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

  const addOneLineFunc = function (line: string): string {
    return Tools.addOneLine_Format(line, prefix_indent);
  };

  node_method.parameters.map((param, index) => {
    const type = param.type;
    const bptype = BPTypeHelper.convertToBPType(param.type);

    const default_conv_bpfromcpp = bptype.bpConv_BPFromCpp;
    const default_conv_cppfrombp = bptype.bpConv_CppFromBP;

    contextParam_BPFromCpp = genContext_ConvDeclType(
      param.name,
      AGORA_MUSTACHE_DATA.UEBP_,
      default_conv_bpfromcpp,
      bptype.bpConvDeclType_BPFromCpp
    );

    contextParam_CppFromBP = genContext_ConvDeclType(
      param.name,
      AGORA_MUSTACHE_DATA.RAW_,
      default_conv_cppfrombp,
      bptype.bpConvDeclType_CppFromBP
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
