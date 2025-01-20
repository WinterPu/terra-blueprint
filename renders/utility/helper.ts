import * as path from 'path';

import {
  CXXFile,
  CXXTYPE,
  CXXTerraNode,
  ConstructorInitializer,
  SimpleType,
} from '@agoraio-extensions/cxx-parser';
import {
  ParseResult,
  RenderResult,
  TerraContext,
} from '@agoraio-extensions/terra-core';

import {
  MustacheRenderConfiguration,
  renderWithConfiguration,
} from '@agoraio-extensions/terra_shared_configs';

import { map } from 'lodash';

import * as CustomUserData from './additional_parsedata';

import * as BPHelper from './blueprint_special/bp_helper';
import * as Logger from './logger';

const map_failure_return_val: Record<string, string> = {
  'int': 'AGORA_UE_ERR_CODE(ERROR_NULLPTR)',
  'char const*': 'nullptr',
  'bool': 'false',
  'agora_refptr': 'nullptr',
  'agora::rtc::video_track_id_t': '0',
  'float': '0.0f',
  'agora::rtc::IScreenCaptureSourceList*': 'nullptr',
  'agora::rtc::CONNECTION_STATE_TYPE':
    'agora::rtc::CONNECTION_STATE_TYPE::CONNECTION_STATE_FAILED',
  'int64_t': '0',
  'uint64_t': '0',
  'agora_refptr<agora::rtc::IMediaPlayer>': 'nullptr',
  'agora_refptr<agora::rtc::IMediaRecorder>': 'nullptr',
  'void': '',
};

const list_custom_impl_methods = [
  'initialize',
  'setupRemoteVideo',
  'setupLocalVideo',
  'setupRemoteVideoEx',
];

export function UESDK_CheckIfApiExcluded(method_name: string): boolean {
  // console.log(`method_name: ${method_name} is excluded: ${list_custom_impl_methods.includes(method_name)}`);
  return list_custom_impl_methods.includes(method_name);
}

export function UESDK_GetFailureReturnVal(
  return_type: string
): string | undefined {
  const returnValue = map_failure_return_val[return_type];

  if (returnValue === undefined) {
    Logger.PrintError(`Error: No value found for return type "${return_type}"`);
  }

  return returnValue;
}

const regMap: { [key: string]: string } = {
  isCallback: '.*(Observer|Handler|Callback|Receiver|Sink).*',
};

export function isMatch(str: string, type: string): boolean {
  let result = false;
  if (regMap[type]) {
    result = new RegExp(regMap[type]).test(str);
  }
  return result;
}

export function formatAsCppComment(input: string): string {
  // 去掉首尾空格和换行
  const trimmedInput = input.trim();

  // 将每行前加 *，并包裹在 /* 和 */
  const commentLines = trimmedInput
    .split('\n')
    .map((line) => ` * ${line}`)
    .join('\n');

  return `/*\n${commentLines}\n */`;
}

export function preProcessNode(cxxfiles: CXXFile[]) {
  BPHelper.initMapRegisteredData();

  cxxfiles.map((cxxfile: CXXFile) => {
    cxxfile.nodes.map((node) => {
      if (node.__TYPE == CXXTYPE.Clazz) {
        // Only For Clazz
        BPHelper.registerBPNameForAgora_Class(
          node.name,
          BPHelper.genBPNameForAgora_Class(node.name)
        );
      } else if (node.__TYPE == CXXTYPE.Struct) {
        // Only For Struct
        BPHelper.registerBPNameForAgora_Struct(
          node.name,
          BPHelper.genBPNameForAgora_Struct(node.name)
        );
      } else if (node.__TYPE == CXXTYPE.Enumz) {
        // Only For Enumz
        BPHelper.registerBPNameForAgora_Enum(
          node.name,
          BPHelper.genBPNameForAgora_Enum(node.name)
        );
      }
    });
  });
}

export function createCompilationDirectivesContent(
  node: CXXTerraNode,
  isStart: boolean = true
): string {
  let directives = node.conditional_compilation_directives_infos;
  if (directives.length == 0) {
    return '';
  }

  let startIf = directives.join('\n');
  if (isStart) {
    return startIf;
  }

  let endIf = directives.map((it) => '#endif').join('\n');

  return endIf;
}

export type FilterTerraNodeFunction = (cxxfile: CXXFile) => CXXTerraNode[];

export type ExcludeApiFunction = (method_name: string) => boolean;

function prettyDefaultValue(
  parseResult: ParseResult,
  defaultValueType: SimpleType,
  defaultValue: string
): string {
  let out = defaultValue;
  if (defaultValue.length == 0) {
    return out;
  }
  let tmpDefaultValueNode = parseResult.resolveNodeByType(defaultValueType);
  if (
    tmpDefaultValueNode.__TYPE == CXXTYPE.Struct ||
    tmpDefaultValueNode.__TYPE == CXXTYPE.Clazz
  ) {
    out = `${tmpDefaultValueNode.fullName}()`;
  } else if (tmpDefaultValueNode.__TYPE == CXXTYPE.Enumz) {
    let tmpName = defaultValue
      .replaceAll('(', '')
      .replaceAll(')', '')
      .split('::')
      .pop();
    out = `${tmpDefaultValueNode.fullName}::${tmpName}`;
  }

  if (out == '__null') {
    out = 'nullptr';
  }

  return out;
}

export function genGeneralTerraData(
  terraContext: TerraContext,
  args: any,
  parseResult: ParseResult,
  func_filter_terrnode?: FilterTerraNodeFunction,
  func_exclude_api?: ExcludeApiFunction
): any {
  let cxxfiles = parseResult.nodes as CXXFile[];

  // bp preprocess: register data
  preProcessNode(cxxfiles);

  //let custom_nodes=
  let view = cxxfiles.map((cxxfile: CXXFile) => {
    const cxxUserData: CustomUserData.CXXFileUserData = {
      fileName: path.basename(
        cxxfile.file_path,
        path.extname(cxxfile.file_path)
      ),
    };
    cxxfile.user_data = cxxUserData;

    let nodes = cxxfile.nodes;
    if (func_filter_terrnode) {
      nodes = func_filter_terrnode(cxxfile);
    }

    cxxfile.nodes = nodes.map((node: CXXTerraNode) => {
      if (node.__TYPE == CXXTYPE.Clazz) {
        // Only For Clazz
        let hasSupportApi = false;
        node.asClazz().methods.map((method, index) => {
          let bIsCallbackMethod = isMatch(node.name, 'isCallback');

          // let bDebug = method.name === "getScreenCaptureSources";
          // if (bDebug){
          //     debugger
          // }

          const clazzMethodUserData: CustomUserData.ClazzMethodUserData = {
            hasConditionalDirective:
              method.conditional_compilation_directives_infos.length > 0,
            isExcluded: func_exclude_api
              ? func_exclude_api(method.name)
              : false,
            failureReturnVal: UESDK_GetFailureReturnVal(
              method.return_type.source
            ),
            hasReturnVal: method.return_type.source.toLowerCase() != 'void',

            macro_scope_start: createCompilationDirectivesContent(method),
            macro_scope_end: createCompilationDirectivesContent(method, false),
            commentCppStyle: formatAsCppComment(method.comment),
            isFirst: index === 0,
            isLast: index === node.asClazz().methods.length - 1,
            isExMethod: method.parent_name === 'IRtcEngineEx',
            callerInstanceName:
              method.parent_name === 'IRtcEngineEx'
                ? '((IRtcEngineEx*)RtcEngine)'
                : 'RtcEngine',

            // bp
            bpReturnType: BPHelper.genBPReturnType(method.return_type),

            bpMethodName: BPHelper.genBPMethodName(method.name),

            bpIsCallback: bIsCallbackMethod,
            bpCallbackDelegateMacroName: bIsCallbackMethod
              ? BPHelper.genbpCallbackDelegateMacroName(
                  method.parameters.length
                )
              : 'NotCallbackMethod',
            bpCallbackDelegateTypeName: bIsCallbackMethod
              ? BPHelper.genbpCallbackDelegateTypeName(method.name)
              : 'NotCallbackMethod',
            bpCallbackDelegateVarName: bIsCallbackMethod
              ? BPHelper.genbpCallbackDelegateVarName(method.name)
              : 'NotCallbackMethod',
            bpIsNoParamCallback:
              bIsCallbackMethod && method.parameters.length === 0,

            ...method.user_data,
          };

          method.user_data = clazzMethodUserData;
          method.parameters.map((parameter, index) => {
            let valDefaultVal = prettyDefaultValue(
              parseResult,
              parameter.type,
              parameter.default_value
            );
            let commentDefaultValue =
              valDefaultVal !== '' ? ' /* ' + valDefaultVal + ' */ ' : '';
            valDefaultVal = valDefaultVal !== '' ? ' = ' + valDefaultVal : '';
            const parameterUserData: CustomUserData.ParameterUserData = {
              lenParameters: method.parameters.length,
              commentCppStyle: formatAsCppComment(parameter.comment),
              isFirst: index === 0,
              isLast: index === method.parameters.length - 1,
              defaultValue: valDefaultVal,
              defaultValueComment: commentDefaultValue,

              // bp
              bpParameterType: BPHelper.genBPParameterType(parameter.type),
              ...parameter.user_data,
            };
            parameter.user_data = parameterUserData;
          });
        });

        const terraNodeUserData: CustomUserData.TerraNodeUserData = {
          // isStruct: node.__TYPE === CXXTYPE.Struct,
          // isEnumz: node.__TYPE === CXXTYPE.Enumz,
          isClazz: node.__TYPE === CXXTYPE.Clazz,
          prefix_name: node.name.replace(new RegExp('^I(.*)'), '$1'),
          isCallback: isMatch(node.name, 'isCallback'),
          hasBaseClazzs: node.asClazz().base_clazzs.length > 0,
          hasSupportApi: hasSupportApi,

          ...node.user_data,
        };
        node.user_data = terraNodeUserData;
      } else if (node.__TYPE == CXXTYPE.Enumz) {
        let valLenEnumConstants = node.asEnumz().enum_constants.length;
        const terraNodeUserData: CustomUserData.TerraNodeUserData = {
          isEnumz: node.__TYPE === CXXTYPE.Enumz,
          lenEnumConstants: valLenEnumConstants,
          bpGenEnumConversionFunction:
            node.asEnumz().enum_constants.length === 1
              ? 'GEN_UABTFUNC_SIGNATURE_ENUMCONVERSION_1_ENTRY'
              : 'GEN_UABTFUNC_SIGNATURE_ENUMCONVERSION_' +
                valLenEnumConstants +
                '_ENTRIES',
          ...node.user_data,
        };
        node.user_data = terraNodeUserData;

        // Only For Enumz
        node.asEnumz().enum_constants.map((enum_constant, index) => {
          const enumConstantsUserData: CustomUserData.EnumConstantsUserData = {
            commentCppStyle: formatAsCppComment(enum_constant.comment),

            isFirst: index === 0,

            isLast: index === node.asEnumz().enum_constants.length - 1,

            ...enum_constant.user_data,
          };
          enum_constant.user_data = enumConstantsUserData;
        });
      } else if (node.__TYPE == CXXTYPE.Struct) {
        const dict_variable_initializer: BPHelper.BPDictInitializer = {};

        node.asStruct().constructors.map((constructor, index) => {
          if (constructor.parameters.length == 0) {
            //default constructor
            constructor.initializerList.map((initializer) => {
              dict_variable_initializer[initializer.name] = initializer;
            });
          }
        });

        // Only For Struct
        node.asStruct().member_variables.map((member_variable, index) => {
          const conversion = BPHelper.getCppBPConversion(member_variable.type);
          const valBPType = BPHelper.convertToBPType(member_variable.type);
          const [bValNeedDefaultVal, valDefaultVal] =
            BPHelper.getBPMemberVariableDefaultValue(
              dict_variable_initializer,
              member_variable
            );
          const structMemberVariableUserData: CustomUserData.StructMemberVariableUserData =
            {
              commentCppStyle: formatAsCppComment(member_variable.comment),
              isFirst: index === 0,
              isLast: index === node.asStruct().member_variables.length - 1,

              bpType: valBPType,
              bpIsUStruct: BPHelper.checkIsUStruct(valBPType),

              bpNeedConvTo: conversion.bNeedConvTo,
              bpNameConvFuncTo: conversion.nameConvFuncTo,

              bpNeedConvFrom: conversion.bNeedConvFrom,
              bpNeedConvFromMemoAlloc: conversion.bNeedConvFromMemoAlloc,
              bpNeedConvFromSetData: conversion.bNeedConvFromSetData,
              bpNameConvFuncFrom: conversion.nameConvFuncFrom,
              bpNameConvFuncFromAdditional:
                conversion.nameConvFuncFromAdditional,

              bpNeedDefaultValue: bValNeedDefaultVal,
              bpDefaultValue: valDefaultVal,

              ...member_variable.user_data,
            };
          member_variable.user_data = structMemberVariableUserData;
        });
      }

      return node;
    });

    return cxxfile;
  });

  //remove Clazz/Enumz/Struct doesn't exist file
  view = view.filter((cxxfile) => {
    return (
      cxxfile.nodes.filter((node) => {
        const [typeCategoryName, valBPNodeName] = BPHelper.getRegisteredBPType(
          node.name
        );
        const terraNodeUserData: CustomUserData.TerraNodeUserData = {
          isStruct: node.__TYPE === CXXTYPE.Struct,
          isEnumz: node.__TYPE === CXXTYPE.Enumz,
          isClazz: node.__TYPE === CXXTYPE.Clazz,

          fullTypeWithNamespace: node.namespaces.join('::') + '::' + node.name,

          commentCppStyle: formatAsCppComment(node.comment),

          bpNodeName: valBPNodeName,
          bpHasRegistered: typeCategoryName !== CXXTYPE.Unknown,
          ...node.user_data,
        };
        node.user_data = terraNodeUserData;

        return (
          node.__TYPE === CXXTYPE.Clazz ||
          node.__TYPE === CXXTYPE.Enumz ||
          node.__TYPE === CXXTYPE.Struct
        );
      }).length > 0
    );
  });

  return view;
}

export function mergeAllNodesToOneCXXFile(view: CXXFile[]): CXXFile {
  const allNodesFile = new CXXFile();

  view.forEach((cxxfile: CXXFile) => {
    allNodesFile.nodes = [...allNodesFile.nodes, ...cxxfile.nodes];
  });

  return allNodesFile;
}
