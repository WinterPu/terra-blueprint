import { CXXFile, CXXTYPE,SimpleType, CXXTerraNode } from '@agoraio-extensions/cxx-parser';

import * as Logger from '../logger';

// [TBD]
/*
1. get default value
2. type conversion function
3. whitelist and blacklist
*/

export const map_cpptype_2_uebptype : { [key: string]: string }  = {
    'void': 'void',
    'int' : 'int',
    'float' : 'float',
    'double' : 'FString',
    'const char*' : 'FString',
    'char const*' : 'FString',


    // not builtin type
    'uint8_t' : 'Byte',
    'int32_t' : 'int',
    'uint32_t' : 'int64',
    'int64_t' : 'int64',
    'uint64_t' : 'FString',
    
    'agora::rtc::uid_t' : 'int64',



    // [TBD] some types that may have issues" 
    'size_t' : 'int64',

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

// others (not in this map): type => UABT_type

export const map_cpp2bp_convert_function_name : { [key: string]: string } = {
    'uid_t': 'UABT::ToUID',
    'uint32_t': 'UABT::ToUInt32',
    'track_id_t': 'UABT::ToVTID',
    'double':  'UABT::ToDouble',
    'view_t': 'UABT::ToView',

};

export const map_bp2cpp_convert_function_name : { [key: string]: string } = {
    'view_t': 'UABT::FromViewToInt',
    'double': 'UABT::FromDouble',
};

function removeNamespace(input: string): string {
    // use regular expression to remove namespace
    return input.replace(/.*::/, '');
}

export function convertToBPType(type: SimpleType,isConst?:boolean): string {
    console.log("convertToBPType",type.source);
    let bpType = map_cpptype_2_uebptype[type.source];
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




export function genBPConvertToRawType(type: SimpleType): [boolean,string] {
    let typename_without_namespace = removeNamespace(type.name);
    let [typeCategory,bpTypeName] = getRegisteredBPType(typename_without_namespace);
    if(typeCategory == CXXTYPE.Enumz){
        return [true,"UABTEnum::ToRawValue"];
    }
    let convert_function = map_cpp2bp_convert_function_name[type.name];
    if(convert_function){
        return [true,convert_function];
    }
    else{
        return [false,""];
    }
}

export function genBPConvertFromRawType(type: SimpleType): [boolean,string] {
    let typename_without_namespace = removeNamespace(type.name);
    let [typeCategory,bpTypeName] = getRegisteredBPType(typename_without_namespace);
    if(typeCategory == CXXTYPE.Enumz){
        return [true,"UABTEnum::WrapWithUE"];
    }
    let convert_function = map_bp2cpp_convert_function_name[type.name];
    if(convert_function){
        return [true,convert_function];
    }
    else{
        return [false,""];
    }
}


export function checkIsUStruct(bpType: string): boolean {
    if(bpType && bpType.includes("FUABT_")){
        return true;
    }
    return false;
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