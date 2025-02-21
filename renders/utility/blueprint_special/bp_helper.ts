import { parse } from 'path';

import {
  CXXFile,
  CXXTYPE,
  CXXTerraNode,
  ConstructorInitializer,
  MemberFunction,
  MemberVariable,
  SimpleType,
  Struct,
} from '@agoraio-extensions/cxx-parser';

import * as CppHelper from '../cpp_helper';
import * as Logger from '../logger';

import * as Tools from '../tools';

import { BPMethodContext, BPStructContext } from './bpcontext_data';
import { map_native_ptr_name } from './bptype_data';
import {
  ConvWayType_BPFromCpp,
  ConvWayType_CppFromBP,
  UEBPType,
} from './bptype_helper';

import * as BPTypeHelper from './bptype_helper';

export function genBPReturnType(return_type: SimpleType): string {
  const bp_type = BPTypeHelper.convertToBPType(return_type);
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
const mapCpp2BPClass: Map<string, string> = new Map();
const mapCpp2BPStruct: Map<string, string> = new Map();
const mapCpp2BPEnum: Map<string, string> = new Map();

export function getMapCpp2BPClass(): Map<string, string> {
  return mapCpp2BPClass;
}

export function getMapCpp2BPStruct(): Map<string, string> {
  return mapCpp2BPStruct;
}

export function getMapCpp2BPEnum(): Map<string, string> {
  return mapCpp2BPEnum;
}

export function initMapRegisteredData() {
  mapCpp2BPClass.clear();
  mapCpp2BPStruct.clear();
  mapCpp2BPEnum.clear();
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

export function genBPNameForAgora_Class(clazz_name: string): string {
  // legency issue
  // Because the design previously removed the leading 'I'.
  // ex. IRtcEngine => UAgoraBPuRtcEngine
  if (clazz_name.startsWith('I')) {
    clazz_name = clazz_name.slice(1); // 去掉开头的 I
  }
  return 'UAgoraBPu' + clazz_name;
}

export function genBPNameForAgora_Struct(struct_name: string): string {
  return 'FUABT_' + struct_name;
}

export function genBPNameForAgora_Enum(enum_name: string): string {
  return 'EUABT_' + enum_name;
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

  const STR_AGORA_DATA = 'AgoraData';
  const STR_CREATE_RAW_DATA = 'CreateRawData';
  const STR_FREE_RAW_DATA = 'FreeRawData';

  const addOneLineFunc = function (line: string): string {
    return Tools.addOneLine_Format(line, prefix_indent);
  };
  // Ex. {{user_data.fullTypeWithNamespace}} AgoraData;
  contextCreateRawData += addOneLineFunc(
    `${Tools.generateFullScopeName(node_struct)} ${STR_AGORA_DATA};`
  );
  node_struct.member_variables.map((member_variable, index) => {
    let type = member_variable.type;
    let bpType = BPTypeHelper.convertToBPType(type);
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
    if (bpType.bpNeedConvFunc_BPFromCpp) {
      contextConstructor += addOneLineFunc(
        `this->${member_variable.name} = ${bpType.bpNameConvFunc_BPFromCpp}(${STR_AGORA_DATA}.${member_variable.name});`
      );
    } else {
      contextConstructor += addOneLineFunc(
        `this->${member_variable.name} = ${STR_AGORA_DATA}.${member_variable.name};`
      );
    }

    // **** CreateRawData Context ****
    if (bpType.bpConvWayType_CppFromBP) {
      if (
        bpType.bpConvWayType_CppFromBP === ConvWayType_CppFromBP.Basic ||
        bpType.bpConvWayType_CppFromBP === ConvWayType_CppFromBP.NewFreeData
      ) {
        // Ex. AgoraData.{{name}} = {{user_data.bpNameConvFuncFrom}}({{name}});
        contextCreateRawData += addOneLineFunc(
          `${STR_AGORA_DATA}.${member_variable.name} = ${bpType.bpNameConvFunc_CppFromBP}(${member_variable.name});`
        );
      } else if (
        bpType.bpConvWayType_CppFromBP === ConvWayType_CppFromBP.SetData
      ) {
        // Ex. {{user_data.bpNameConvFuncFrom}}(AgoraData.{{name}}, this->{{name}}, XXXFUABT_UserInfo_UserAccountLength);
        // TBD(WinterPu): need to check the length of the variable
        contextCreateRawData += addOneLineFunc(
          `${bpType.bpNameConvFunc_CppFromBP}}(${STR_AGORA_DATA}.${member_variable.name}, this->${member_variable.name}, XXXFUABT_UserInfo_UserAccountLength);`
        );
      } else {
        if (mapCpp2BPStruct.has(type.name)) {
          // Is UStruct
          // Ex. AgoraData.{{name}} = {{name}}.CreateRawData();
          contextCreateRawData += addOneLineFunc(
            `${STR_AGORA_DATA}.${member_variable.name} = ${member_variable.name}.${STR_CREATE_RAW_DATA}();`
          );
        } else {
          // AgoraData.{{name}} = {{name}};
          contextCreateRawData += addOneLineFunc(
            `${STR_AGORA_DATA}.${member_variable.name} = ${member_variable.name};`
          );
        }
      }
    } else {
      contextCreateRawData += addOneLineFunc(
        `${STR_AGORA_DATA}.${member_variable.name} = ${member_variable.name};`
      );
    }

    // **** FreeRawData Context ****
    let tmpContextFreeRawData = '';
    if (bpType.bpConvWayType_CppFromBP === ConvWayType_CppFromBP.NewFreeData) {
      // Ex. {{name}}.FreeRawData(AgoraData.{{name}});
      tmpContextFreeRawData += addOneLineFunc(
        `${bpType.bpNameConvFuncAdditional_CppFromBP}(${STR_AGORA_DATA}.${member_variable.name});`
      );
    }

    if (mapCpp2BPStruct.has(type.name)) {
      // Ex. {{name}}.FreeRawData(AgoraData.{{name}});
      tmpContextFreeRawData += addOneLineFunc(
        `${member_variable.name}.${STR_FREE_RAW_DATA}(${STR_AGORA_DATA}.${member_variable.name});`
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
  contextCreateRawData += addOneLineFunc(`return ${STR_AGORA_DATA};`);

  const result = new BPStructContext();
  result.contextConstructor = contextConstructor;
  result.contextCreateRawData = contextCreateRawData;
  result.contextFreeRawData = contextFreeRawData;

  return result;
}

export function genContext_BPMethod(
  node_method: MemberFunction,
  prefix_indent: string = ''
): BPMethodContext {
  let contextParamsCppFromBP = '';
  let contextParamsBPFromCpp = '';

  const addOneLineFunc = function (line: string): string {
    return Tools.addOneLine_Format(line, prefix_indent);
  };

  node_method.parameters.map((param, index) => {
    const type = param.type;
    const bptype = BPTypeHelper.convertToBPType(param.type);

    contextParamsCppFromBP += addOneLineFunc(
      `${type.source} Raw_${param.name} = ${param.name};`
    );

    contextParamsBPFromCpp += addOneLineFunc(
      `${bptype.source} UEBP_${param.name} = ${param.name};`
    );
  });

  const result = new BPMethodContext();
  result.contextParamsCppFromBP = contextParamsCppFromBP;
  result.contextParamsBPFromCpp = contextParamsBPFromCpp;

  return result;
}

export function genContext_BPMethod_NativePtr(
  node_method: MemberFunction,
  prefix_indent: string = ''
): string {
  return BPTypeHelper.getMethod_NativePtr(node_method);
}
