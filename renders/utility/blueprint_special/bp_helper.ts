import { CXXFile, CXXTYPE,SimpleType, CXXTerraNode } from '@agoraio-extensions/cxx-parser';

import * as Logger from '../logger';

// [TBD]
/*
1. get default value
2. type conversion function
*/

export const map_cpptype_2_uebptype : { [key: string]: string }  = {
    'void': 'void',
    'int' : 'int',
    'float' : 'float',
    'double' : 'FString',
    'const char*' : 'FString',


    // not builtin type
    'uint8_t' : 'Byte',
    'int32_t' : 'int',
    'uint32_t' : 'int64',
    'uid_t' : 'int64',
    'int64_t' : 'int64',
    'uint64_t' : 'FString',
    
};

// others (not in this map): type => UABT_type

export const map_cpp2bp_convert_function_name : { [key: string]: string } = {

};


function removeNamespace(input: string): string {
    // use regular expression to remove namespace
    return input.replace(/.*::/, '');
}

export function convertToBPType(type: SimpleType,isConst?:boolean): string {
    let bpType = map_cpptype_2_uebptype[type.name];
    if(bpType){
       // return bpType;
    }
    else{

        if(type.is_builtin_type){
            bpType = type.name;
        }
        else{
            // [TBD] need to distinguish between UStruct and UEnum
            let varname_without_namespace = removeNamespace(type.name);
            bpType = "FUABT_" + varname_without_namespace;
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

const words: string[] = [
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
        return `DECLARE_DYNAMIC_MULTICAST_DELEGATE_${words[len_params - 1]}Params`;
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

