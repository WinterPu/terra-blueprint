import { CXXFile, CXXTYPE,SimpleType, CXXTerraNode ,ConstructorInitializer,MemberVariable} from '@agoraio-extensions/cxx-parser';

import * as Logger from '../logger';
import { parse } from 'path';

// [TBD]
/*
1. get default value
2. type conversion function
3. whitelist and blacklist
*/


// [TBD] if need namespace or not ？

// [Key] type.source namespace removed
export const map_cpptype_2_uebptype : { [key: string]: string }  = {
    'void': 'void',
    'int' : 'int',
    'float' : 'float',
    'double' : 'FString',
    'const char*' : 'FString',
    'char const*' : 'FString',
    'unsigned char const*': 'FString',

    'unsigned short': 'int',
    'unsigned int': 'int64',

    // not builtin type
    'uint8_t' : 'Byte',
    'int32_t' : 'int',
    'uint32_t' : 'int64',
    'int64_t' : 'int64',
    'uint64_t' : 'FString',
    
    'uid_t' : 'int64',

    'long long' : 'int64',



    // [TBD] some types that may have issues" 
    'size_t' : 'int64',
    'void*': 'void*',



    // ==== agora special =====

    // Optional
    'Optional<bool>': 'FUABT_Opt_bool',
    'Optional<agora::rtc::VIDEO_STREAM_TYPE>': 'FUABT_Opt_VIDEO_STREAM_TYPE',
    'Optional<double>': 'FUABT_Opt_double',
    'Optional<int>': 'FUABT_Opt_int',
    'Optional<agora::rtc::CAMERA_DIRECTION>': 'FUABT_Opt_CAMERA_DIRECTION',
    'Optional<agora::rtc::CAMERA_FOCAL_LENGTH_TYPE>': 'FUABT_Opt_CAMERA_FOCAL_LENGTH_TYPE',
    'Optional<const char *>': 'FUABT_Opt_ConstCharPtr',
    'Optional<agora::rtc::CLIENT_ROLE_TYPE>': 'FUABT_Opt_CLIENT_ROLE_TYPE',
    'Optional<agora::rtc::AUDIENCE_LATENCY_LEVEL_TYPE>': 'FUABT_Opt_AUDIENCE_LATENCY_LEVEL_TYPE',
    'Optional<agora::CHANNEL_PROFILE_TYPE>': 'FUABT_Opt_CHANNEL_PROFILE_TYPE',
    'Optional<agora::rtc::video_track_id_t>': 'FUABT_Opt_video_track_id_t',
    'Optional<agora::rtc::THREAD_PRIORITY_TYPE>': 'FUABT_Opt_THREAD_PRIORITY_TYPE',

};


const map_cpptype_default_value : { [key: string]: string } = {
    'int' : '0',
    'float' : '0.0',
    'double' : '0.0',
    'const char*' : '""',
    'char const*' : '""',
    'bool' : 'false',

    'unsigned short': '0',
    'unsigned int': '0',

    'uint8_t' : '0',
    'int32_t' : '0',
    'uint32_t' : '0',
    'int64_t' : '0',
    'uint64_t' : '0',
    'uid_t' : '0',

    'long long' : '0',

    'size_t' : '0',
    'void*': 'nullptr',

    'unsigned char const*': '""',


    // ==== agora special =====

}


// type convert functions

export const map_bp2cpp_convert_function_name : { [key: string]: string } = {
    'double':  'UABT::ToDouble',
    

    'uid_t': 'UABT::ToUID',
    'uint32_t': 'UABT::ToUInt32',
    'track_id_t': 'UABT::ToVTID',
    'view_t': 'UABT::ToView',

};

export const map_cpp2bp_convert_function_name : { [key: string]: string } = {
    'view_t': 'UABT::FromViewToInt',
    'double': 'UABT::FromDouble',

    // array
    'float*': 'UABT::FromFloatArray',
};

export const map_bp2cpp_memory_handle : { [key: string]: [string,string] } = { 
    // FString
    'char*' : ['UABT::New_CharPtr','UABT::Free_CharPtr'],
    'unsigned char*': ['UABT::New_UnsignedCharPtr','UABT::Free_UnsignedCharPtr'],
    'char**': ['UABT::New_CharArrayPtr','UABT::Free_CharArrayPtr'],
    'uid_t*': ['UABT::New_UIDArrayPtr','UABT::Free_UIDArrayPtr'],

    'generic': ['UABT::New_RawData','UABT::Free_RawData'],
    'genericArray': ['UABT::New_RawDataArray','UABT::Free_RawDataArray'],
};

export const map_setdata_function_name: { [key: string]: string } = {
    //[TBD] need to add flag to judge if it needs to use set data 

    //example:
    // UABT::SetCharArrayPtr(AgoraData.userAccount, this->userAccount, agora::rtc::MAX_USER_ACCOUNT_LENGTH);
    // No need to free memory
    'char*': 'UABT::SetCharArrayPtr',
};



function removeNamespace(input: string): string {
    if (!input) return input; // handle undefined
    // use regular expression to remove namespace
    return input.replace(/.*::/, '');
}

export function convertToBPType(type: SimpleType,isConst?:boolean): string {

    // [TBD] - char* how to handle
    // char** how to handle
    console.log("convertToBPType",type.source);
    let typename_without_namespace = removeNamespace(type.source);
    let bpType = map_cpptype_2_uebptype[typename_without_namespace];
    if(bpType){
       // return bpType;
    }
    else{
        // [TBD] need to distinguish between UStruct and UEnum
        let varname_without_namespace = removeNamespace(type.name);
        let [typeCategory,bpTypeName] = getRegisteredBPType(varname_without_namespace);

        if(typeCategory != CXXTYPE.Unknown){
            bpType = bpTypeName;
        }
        else if(type.is_builtin_type){
            bpType = type.name;
        }
        else{
            Logger.PrintError(`convertToBPType: No Conversion Mapping ${type.name}`);
            bpType = type.name;
        }

        // check if it is a array
        // analyze if it is a array type
        let [isArray, arrayType] = parseArrayType(type.source);
        if(isArray){
            bpType = "TArray<" + bpType + ">";
        }
    }

    if(isConst){
        bpType = "const " + bpType + " &";
    }


    // [TBD] need to judge if the parameter is a input or output parameter

    return bpType;
}

export function genBPReturnType(return_type: SimpleType): string {
    return convertToBPType(return_type,false);
}

export function genBPParameterType(return_type: SimpleType): string {
    return convertToBPType(return_type,return_type.is_const);
}

export function genBPMethodName(method_name: string): string {
    if (!method_name) return method_name; // handle empty string
    return method_name.charAt(0).toUpperCase() + method_name.slice(1);
}

const bp_multicast_number_prefix: string[] = [
    "One", "Two", "Three", "Four", 
    "Five", "Six", "Seven", "Eight", "Nine"
];

export function genbpCallbackDelegateMacroName(len_params: number): string {
    if (len_params > 9) {
        Logger.PrintError(`Error: Invalid number of parameters: ${len_params}`);
        return "NoDelegate";
    }
    else if (len_params == 0) {
        return "DECLARE_DYNAMIC_MULTICAST_DELEGATE";
    }
    else if (len_params == 1) {
        return "DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam";
    }
    else {
        return `DECLARE_DYNAMIC_MULTICAST_DELEGATE_${bp_multicast_number_prefix[len_params - 1]}Params`;
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

enum CppBPConvWayType {
    NoNeedConversion, // no need conversion
    Basic, // need basic conversion method
    NewFreeData, // need memory allocation
    SetData, // directly set data
}

export class CppBPConversion{
    convFuncType :CppBPConvWayType;
    convFunc:string;
    convFuncAdditional01:string; // Ex. free data conv function

    constructor() {
        this.convFuncType = CppBPConvWayType.NoNeedConversion;
        this.convFunc = "";
        this.convFuncAdditional01 = "";
    };
};

export type CppBPConversionTerraData = {
    bNeedConvTo: boolean;
    nameConvFuncTo: string;

    bNeedConvFrom: boolean;
    bNeedConvFromMemoAlloc: boolean;
    bNeedConvFromSetData: boolean;
    nameConvFuncFrom: string;
    nameConvFuncFromAdditional: string;
};



export function getCppBPConversion(type: SimpleType): CppBPConversionTerraData {

    const convBPToCpp = genBPConvertToRawType(type);
    const convBPFromCpp = genBPConvertFromRawType(type);

    let conversion: CppBPConversionTerraData = {
        bNeedConvTo: convBPToCpp.convFuncType == CppBPConvWayType.Basic,
        nameConvFuncTo: convBPToCpp.convFunc,

        bNeedConvFrom: convBPFromCpp.convFuncType == CppBPConvWayType.Basic,
        bNeedConvFromMemoAlloc: convBPFromCpp.convFuncType == CppBPConvWayType.NewFreeData,
        bNeedConvFromSetData: convBPFromCpp.convFuncType == CppBPConvWayType.SetData,
        nameConvFuncFrom: convBPFromCpp.convFunc,
        nameConvFuncFromAdditional: convBPFromCpp.convFuncAdditional01,
    };
    return conversion;
}


export function genBPConvertToRawType(type: SimpleType): CppBPConversion {
    let conversion = new CppBPConversion();
    // UEnum
    let typename_without_namespace = removeNamespace(type.name);
    let [typeCategory,bpTypeName] = getRegisteredBPType(typename_without_namespace);
    if(typeCategory == CXXTYPE.Enumz){

        conversion = {
            convFuncType: CppBPConvWayType.Basic,
            convFunc: "UABTEnum::ToRawValue",
            convFuncAdditional01: "",
        };
    }

    let convert_function = map_bp2cpp_convert_function_name[type.name];
    if(convert_function){
        conversion = {
            convFuncType: CppBPConvWayType.Basic,
            convFunc: convert_function,
            convFuncAdditional01: "",
        };
    }
    else{
    }
    return conversion;
}

export function genBPConvertFromRawType(type: SimpleType): CppBPConversion {
    let conversion = new CppBPConversion();

    // Enum
    let typename_without_namespace = removeNamespace(type.name);
    let [typeCategory,bpTypeName] = getRegisteredBPType(typename_without_namespace);
    if(typeCategory == CXXTYPE.Enumz){
        conversion = {
            convFuncType: CppBPConvWayType.Basic,
            convFunc: "UABTEnum::WrapWithUE",
            convFuncAdditional01: "",
        };
    }


    let convert_function = map_cpp2bp_convert_function_name[type.name];
    if(convert_function){
        conversion = {
            convFuncType: CppBPConvWayType.Basic,
            convFunc: convert_function,
            convFuncAdditional01: "",
        };
    }
    else{
        let func_memorys= map_bp2cpp_memory_handle[type.name];
        if(func_memorys){
            conversion = {
                convFuncType: CppBPConvWayType.NewFreeData,
                convFunc: func_memorys[0], // New Data
                convFuncAdditional01: func_memorys[1], // Free Data
            };
        }
        else{

            let set_data_func = map_setdata_function_name[type.name];
            if(set_data_func){
                conversion = {
                    convFuncType: CppBPConvWayType.SetData,
                    convFunc: set_data_func,
                    convFuncAdditional01: "",
                };
            }   
        }
    }

    return conversion;
}


export function checkIsUStruct(bpType: string): boolean {
    if(bpType && bpType.includes("FUABT_")){
        return true;
    }
    return false;
}


// [TBD] - TArray<char>
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



// struct - member variable: default value
export type BPDictInitializer  = { [paramName: string] : ConstructorInitializer };

export function getBPMemberVariableDefaultValue(dictStructInitializer : BPDictInitializer,member_variable: MemberVariable):[boolean,string]{
    let bNeedDefaultValue = true;
    let valDefaultVal = "Unknown_TBD";

    // TBD if there is no default constructor
    if(dictStructInitializer[member_variable.name]){
        bNeedDefaultValue = true;
        // [TBD] 
        valDefaultVal = dictStructInitializer[member_variable.name].values[0];

        if (valDefaultVal == undefined){
            valDefaultVal = "Unknown_TBD";
        }

        let cpp_type =   dictStructInitializer[member_variable.name]?.type;
        let cpp_type_without_namespace =  removeNamespace(cpp_type);
        let enum_val = mapCpp2BPEnum.get(cpp_type_without_namespace);
        if (enum_val){
            valDefaultVal = "UABT::WrapWithUE(" + dictStructInitializer[member_variable.name].values[0] + ")";
            bNeedDefaultValue = true;
        }
    }

    if(valDefaultVal == "Unknown_TBD"){
        let cpp_type =  dictStructInitializer[member_variable.name]?.type;
        let cpp_type_without_namespace =  removeNamespace(cpp_type);
        if(cpp_type_without_namespace && map_cpptype_default_value[cpp_type_without_namespace]){
            valDefaultVal = map_cpptype_default_value[cpp_type_without_namespace];
            bNeedDefaultValue = true;
        }
    }

    if(valDefaultVal == "Unknown_TBD"){
        let cpp_type_without_namespace =  removeNamespace(member_variable.type.source);
        if(cpp_type_without_namespace && map_cpptype_default_value[cpp_type_without_namespace]){
            valDefaultVal = map_cpptype_default_value[cpp_type_without_namespace];
            bNeedDefaultValue = true;
        }
    }

    if(valDefaultVal == "Unknown_TBD"){
        let cpp_type_without_namespace =  removeNamespace(member_variable.type.source);
        let enum_val = mapCpp2BPEnum.get(cpp_type_without_namespace);
        if (enum_val){
            valDefaultVal = "UABT::WrapWithUE((int)0)";
            bNeedDefaultValue = true;
        }
    }

    if(valDefaultVal == "Unknown_TBD"){
        let cpp_type_without_namespace =  removeNamespace(member_variable.type.source);
        if(mapCpp2BPClass.has(cpp_type_without_namespace) || mapCpp2BPStruct.has(cpp_type_without_namespace)){
            bNeedDefaultValue = false;
        }
    }

    if(valDefaultVal == "Unknown_TBD"){
        if(member_variable.type.name == "Optional"){
            bNeedDefaultValue = false;
        }
    }

    if(valDefaultVal == "Unknown_TBD"){
        let [bIsArray, original_type] = parseArrayType(member_variable.type.source);
        console.log(member_variable.type.source,"getBPMemberVariableDefaultValue",bIsArray,original_type);
        if(bIsArray){
            bNeedDefaultValue = false;
        }
    }

    return [bNeedDefaultValue,valDefaultVal];
}


// About BP Name
let mapCpp2BPClass: Map<string, string> = new Map();
let mapCpp2BPStruct: Map<string, string> = new Map();
let mapCpp2BPEnum: Map<string, string> = new Map();

export function initMapRegisteredData() {
    mapCpp2BPClass.clear();
    mapCpp2BPStruct.clear();
    mapCpp2BPEnum.clear();
}

export function registerBPNameForAgora_Class(clazz_name: string, bp_name: string) {
    mapCpp2BPClass.set(clazz_name, bp_name);
}

export function registerBPNameForAgora_Struct(struct_name: string, bp_name: string) {
    mapCpp2BPStruct.set(struct_name, bp_name);
}

export function registerBPNameForAgora_Enum(enum_name: string, bp_name: string) {
    mapCpp2BPEnum.set(enum_name, bp_name);
}


export function genBPNameForAgora_Class(clazz_name: string): string {
    // legency issue
    // Because the design previously removed the leading 'I'.
    // ex. IRtcEngine => UAgoraBPuRtcEngine
    if (clazz_name.startsWith("I")) {
        clazz_name = clazz_name.slice(1); // 去掉开头的 I
    }
    return "UAgoraBPu" + clazz_name;
}

export function genBPNameForAgora_Struct(struct_name: string): string {
    return "FUABT_" + struct_name;
}

export function genBPNameForAgora_Enum(enum_name: string): string {
    return "EUABT_" + enum_name;
}



export function getRegisteredBPType(node_name: string): [CXXTYPE,string] {
    let typeCategory = CXXTYPE.Unknown;
    let bpTypeName = node_name;

    if(mapCpp2BPClass.has(node_name)){
        typeCategory = CXXTYPE.Clazz;
        bpTypeName = mapCpp2BPClass.get(node_name) ?? node_name;
    }
    else if(mapCpp2BPStruct.has(node_name)){
        typeCategory = CXXTYPE.Struct;
        bpTypeName = mapCpp2BPStruct.get(node_name) ?? node_name;
    }
    else if(mapCpp2BPEnum.has(node_name)){
        typeCategory = CXXTYPE.Enumz;
        bpTypeName = mapCpp2BPEnum.get(node_name) ?? node_name;
    }

    return [typeCategory,bpTypeName];
}