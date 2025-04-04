// Define custom user data for code generation

import { UEBPType } from './blueprint_special/bptype_helper';

export type CXXFileUserData = {
  fileName: string;

  // bp
  bpFileName: string;
  bpIncludeFiles: string[];
};

export type TerraNodeUserData = {
  isStruct: boolean;
  isEnumz: boolean;
  isClazz: boolean;
  isCallback: boolean;
  hasBaseClazzs: boolean;
  hasSupportApi: boolean;
  prefix_name: string;

  commentCppStyle: string;
  macro_scope_start: string;
  macro_scope_end: string;

  // bp

  bpNodeName: string;
  bpHasRegistered: boolean; // if the node is class, struct, enum, it would be registered first.
  lenEnumConstants: number;
  bpIsCallback: boolean;
  bpGenEnumConversionFunction: string;
};

export type SimpleTypeUserData = {
  bpType: UEBPType;
};

export type ClazzUserData = {
  bpContextInst: string;
  bpContextInitDecl: string;
  bpContextInitImpl: string;
};

export type ClazzMethodUserData = {
  hasConditionalDirective: boolean;
  isExcluded: boolean;
  failureReturnVal: string;
  hasReturnVal: boolean;
  hasParameters: boolean;
  isRegisterMethod: boolean;
  isSupport: boolean;
  bindingEventExtension: [];
  bindingExtension: [];

  commentCppStyle: string;
  isFirst: boolean;
  isLast: boolean;
  isExMethod: boolean;
  callerInstanceName: string;

  suffix_attribute: string;

  macro_scope_start: string;
  macro_scope_end: string;
  // bp
  bpReturnType: string;
  bpMethodName: string;
  bpCallbackDelegateMacroName: string;
  bpCallbackDelegateTypeName: string;
  bpCallbackDelegateVarName: string;
  bpIsNoParamCallback: boolean;

  bpContextParamsDecl_CppFromBP: string;
  bpContextParamsUsage_CppFromBP: string;
  bpContextParamsFree_CppFromBP: string;
  bpContextParamsDecl_BPFromCpp: string;
  bpContextParamsUsage_BPFromCpp: string;
  bpContextParamsFree_BPFromCpp: string;
  bpNativePtr: string;
};

export type EnumConstantsUserData = {
  commentCppStyle: string;
  isFirst: boolean;
  isLast: boolean;
};

export type StructUserData = {
  bpContextConstructor: string;
  bpContextCreateRawData: string;
  bpContextFreeRawData: string;
};

export type StructMemberVariableUserData = {
  commentCppStyle: string;
  // bp
  bpFormatDefaultVal: string;
};

export type ParameterUserData = {
  lenParameters: number;
  commentCppStyle: string;
  isFirst: boolean;
  isLast: boolean;
  defaultValue: string;
  defaultValueComment: string; // used in impl: ex. void Func(int a /*1*/)
  // bp
  bpParameterType: string;
  bpDelegateType: string;
};

//////// Define Custom UserData
