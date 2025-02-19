// Define custom user data for code generation

import { UEBPType } from "./blueprint_special/bptype_helper";

export type CXXFileUserData = {
  fileName: string;
};

export type TerraNodeUserData = {
  isStruct: boolean;
  isEnumz: boolean;
  isClazz: boolean;
  isCallback: boolean;
  hasBaseClazzs: boolean;
  hasSupportApi: boolean;
  prefix_name: string;

  fullTypeWithNamespace: string;
  commentCppStyle: string;

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

  macro_scope_start: string;
  macro_scope_end: string;
  commentCppStyle: string;
  isFirst: boolean;
  isLast: boolean;
  isExMethod: boolean;
  callerInstanceName: string;

  suffix_attribute: string;

  // bp
  bpReturnType: string;
  bpMethodName: string;
  bpCallbackDelegateMacroName: string;
  bpCallbackDelegateTypeName: string;
  bpCallbackDelegateVarName: string;
  bpIsNoParamCallback: boolean;
};

export type EnumConstantsUserData = {
  commentCppStyle: string;
  isFirst: boolean;
  isLast: boolean;
};

export type StructUserData = {
  contextConstructor: string;
  contextCreateRawData: string;
  contextFreeRawData: string;
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
};

//////// Define Custom UserData
