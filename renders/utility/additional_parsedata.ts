
// Define custom user data for code generation

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
};

export type ClazzMethodUserData = {
    hasConditionalDirective: boolean;
    failureReturnVal: string;
    hasParameters: boolean;
    isRegisterMethod: boolean;
    isSupport: boolean;
    bindingEventExtension: [];
    bindingExtension: [];
};

export type ParameterUserData = {
    isLast: boolean;
};

//////// Define Custom UserData