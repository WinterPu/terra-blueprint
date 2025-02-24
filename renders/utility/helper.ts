import * as path from 'path';

import {
  CXXFile,
  CXXTYPE,
  CXXTerraNode,
  ConstructorInitializer,
  SimpleType,
  Variable,
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

import * as CustomUserData from './additional_parsedata';

import * as BPHelper from './blueprint_special/bp_helper';

import { map_class_initialization } from './blueprint_special/bptype_data';
import * as CppHelper from './cpp_helper';
import * as FilterHelper from './filter_helper';
import * as Logger from './logger';

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

// preprocess the nodes
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

export type FilterTerraNodeFunction = (cxxfile: CXXFile) => CXXTerraNode[];

export type ExcludeApiFunction = (method_name: string) => boolean;

const STR_NO_CALLBACK: string = 'NotCallbackMethod';

// main function
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
          let context_clazz = BPHelper.genContext_BPClass(node.asClazz());
          const clazzUserData: CustomUserData.ClazzUserData = {
            bpContextInst: context_clazz?.Inst ?? '',
            bpContextInitDecl: context_clazz?.InitDecl ?? '',
            bpContextInitImpl: context_clazz?.InitImpl ?? '',
          };
          node.user_data = clazzUserData;

          const contextBPMethod = BPHelper.genContext_BPMethod(
            method,
            '      '
          );

          const clazzMethodUserData: CustomUserData.ClazzMethodUserData = {
            hasConditionalDirective:
              method.conditional_compilation_directives_infos.length > 0,
            isExcluded: func_exclude_api
              ? func_exclude_api(method.name)
              : false,
            failureReturnVal: FilterHelper.UESDK_GetFailureReturnVal(
              method.return_type.source
            ),
            hasReturnVal: method.return_type.source.toLowerCase() != 'void',

            macro_scope_start:
              CppHelper.createCompilationDirectivesContent(method),
            macro_scope_end: CppHelper.createCompilationDirectivesContent(
              method,
              false
            ),
            commentCppStyle: CppHelper.formatAsCppComment(method.comment),
            suffix_attribute: CppHelper.genSuffixAttribute(method.attributes),
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
              : STR_NO_CALLBACK,
            bpCallbackDelegateTypeName: bIsCallbackMethod
              ? BPHelper.genbpCallbackDelegateTypeName(method.name)
              : STR_NO_CALLBACK,
            bpCallbackDelegateVarName: bIsCallbackMethod
              ? BPHelper.genbpCallbackDelegateVarName(method.name)
              : STR_NO_CALLBACK,
            bpIsNoParamCallback:
              bIsCallbackMethod && method.parameters.length === 0,

            bpContextParamsDecl_BPFromCpp:
              contextBPMethod.contextParam_BPFromCpp.contextDecl,
            bpContextParamsUsage_BPFromCpp:
              contextBPMethod.contextParam_BPFromCpp.contextUsage,
            bpContextParamsFree_BPFromCpp:
              contextBPMethod.contextParam_BPFromCpp.contextFree,

            bpContextParamsDecl_CppFromBP:
              contextBPMethod.contextParam_CppFromBP.contextDecl,
            bpContextParamsUsage_CppFromBP:
              contextBPMethod.contextParam_CppFromBP.contextUsage,
            bpContextParamsFree_CppFromBP:
              contextBPMethod.contextParam_CppFromBP.contextFree,

            bpNativePtr: BPHelper.genContext_BPMethod_NativePtr(method),
            ...method.user_data,
          };

          method.user_data = clazzMethodUserData;
          if (method.is_variadic) {
            let param_variadic = new Variable();
            param_variadic.name = '...';
            param_variadic.source = '...';
            param_variadic.type = new SimpleType();
            param_variadic.type.clang_qualtype = '';
            method.parameters.push(param_variadic);
          }
          method.parameters.map((parameter, index) => {
            let valDefaultVal = CppHelper.prettyDefaultValue(
              parseResult,
              parameter.type,
              parameter.default_value
            );
            let commentDefaultValue =
              valDefaultVal !== '' ? ' /* ' + valDefaultVal + ' */ ' : '';
            valDefaultVal = valDefaultVal !== '' ? ' = ' + valDefaultVal : '';
            const parameterUserData: CustomUserData.ParameterUserData = {
              lenParameters: method.parameters.length,
              commentCppStyle: CppHelper.formatAsCppComment(parameter.comment),
              isFirst: index === 0,
              isLast: index === method.parameters.length - 1,
              defaultValue: valDefaultVal,
              defaultValueComment: commentDefaultValue,

              // bp
              bpParameterType: BPHelper.genBPParameterType(
                parameter.type,
                parameter.is_output
              ),
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
            commentCppStyle: CppHelper.formatAsCppComment(
              enum_constant.comment
            ),

            isFirst: index === 0,

            isLast: index === node.asEnumz().enum_constants.length - 1,

            ...enum_constant.user_data,
          };
          enum_constant.user_data = enumConstantsUserData;
        });
      } else if (node.__TYPE == CXXTYPE.Struct) {
        const dictInitializer = BPHelper.prepareBPStructInitializerDict(
          node.asStruct()
        );

        const contextStruct = BPHelper.genContext_BPStruct(node.asStruct(), '		');

        const structUserData: CustomUserData.StructUserData = {
          bpContextConstructor: contextStruct.contextConstructor,
          bpContextCreateRawData: contextStruct.contextCreateRawData,
          bpContextFreeRawData: contextStruct.contextFreeRawData,
        };
        node.user_data = structUserData;

        // Only For Struct
        node.asStruct().member_variables.map((member_variable, index) => {
          const bpType = BPHelper.getBPType(member_variable.type);
          const simpleTypeUserData: CustomUserData.SimpleTypeUserData = {
            bpType: bpType,
          };
          member_variable.type.user_data = simpleTypeUserData;

          const formatDefaultVal = BPHelper.getBPStructData_DefaultVal(
            dictInitializer,
            member_variable
          );
          const structMemberVariableUserData: CustomUserData.StructMemberVariableUserData =
            {
              commentCppStyle: CppHelper.formatAsCppComment(
                member_variable.comment
              ),

              bpFormatDefaultVal: formatDefaultVal,

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

          commentCppStyle: CppHelper.formatAsCppComment(node.comment),

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
