import * as path from 'path';
import { CXXFile, CXXTYPE, CXXTerraNode } from '@agoraio-extensions/cxx-parser';
import {
  ParseResult,
  RenderResult,
  TerraContext,
} from '@agoraio-extensions/terra-core';

import {
  renderWithConfiguration,
  MustacheRenderConfiguration,
} from '@agoraio-extensions/terra_shared_configs';

import {
    CXXFileUserData,
    ClazzMethodUserData,
    ParameterUserData,
    TerraNodeUserData,
  } from './additional_parsedata';

import {
    PrintError,
} from './logger';


const map_failure_return_val: Record<string, string> = {
    'int': 'AGORA_UE_ERR_CODE(ERROR_NULLPTR)',
    'char const*': 'nullptr',
    'bool': 'false',
    'agora_refptr' : 'nullptr',
    'agora::rtc::video_track_id_t' : '0',
    'float' : '0.0f',
    'agora::rtc::IScreenCaptureSourceList*' : 'nullptr',
    'agora::rtc::CONNECTION_STATE_TYPE' : 'agora::rtc::CONNECTION_STATE_TYPE::CONNECTION_STATE_FAILED',
    'int64_t' : '0',
    'uint64_t' : '0',
    'agora_refptr<agora::rtc::IMediaPlayer>' : 'nullptr',
    'agora_refptr<agora::rtc::IMediaRecorder>' : 'nullptr',
    'void' : '',

}

export function UESDK_GetFailureReturnVal(return_type:string):string | undefined{
    const returnValue = map_failure_return_val[return_type];

    if (returnValue === undefined) {
        PrintError(`Error: No value found for return type "${return_type}"`);
    }

    return returnValue;
}



export type FilterTerraNodeFunction = (cxxfile: CXXFile) => CXXTerraNode[]

export function genGeneralTerraData(
    terraContext: TerraContext,
    args: any,
    parseResult: ParseResult,
    func_filter_terrnode ?: FilterTerraNodeFunction,
  ): any {

    let cxxfiles = parseResult.nodes as CXXFile[];
    //let custom_nodes= 
    let view = cxxfiles.map((cxxfile: CXXFile) => {
        const cxxUserData: CXXFileUserData = {
            fileName: path.basename(
                cxxfile.file_path,
                path.extname(cxxfile.file_path)
            ),
        };
        cxxfile.user_data = cxxUserData;

        let nodes = cxxfile.nodes;
        if(func_filter_terrnode){
            nodes = func_filter_terrnode(cxxfile);
        }

        cxxfile.nodes = nodes.map((node: CXXTerraNode) => {
            if (node.__TYPE == CXXTYPE.Clazz) {

                let hasSupportApi = false;
                node.asClazz().methods.map((method) => {
                    
                    const clazzMethodUserData: ClazzMethodUserData = {
                    hasConditionalDirective: method.conditional_compilation_directives_infos.length > 0,
                    failureReturnVal: UESDK_GetFailureReturnVal(method.return_type.source),
                    hasReturnVal:method.return_type.source.toLowerCase() != "void",
                    ...method.user_data,
                    };
                    method.user_data = clazzMethodUserData;
                    method.parameters.map((parameter,index) => {
                        const parameterUserData: ParameterUserData = {
                            isLast: index === method.parameters.length - 1,
                            ...parameter.user_data,
                        };
                        parameter.user_data = parameterUserData;
                    });
                });
        
                const terraNodeUserData: TerraNodeUserData = {
                    // isStruct: node.__TYPE === CXXTYPE.Struct,
                    // isEnumz: node.__TYPE === CXXTYPE.Enumz,
                    isClazz: node.__TYPE === CXXTYPE.Clazz,
                    prefix_name: node.name.replace(new RegExp('^I(.*)'), '$1'),
                    hasBaseClazzs: node.asClazz().base_clazzs.length > 0,
                    hasSupportApi: hasSupportApi,
                    ...node.user_data,
                };
                node.user_data = terraNodeUserData;
    
            }

            return node;
        });


        return cxxfile;
    });

    //remove Clazz/Enumz/Struct doesn't exist file
    view = view.filter((cxxfile) => {
        return (
            cxxfile.nodes.filter((node) => {

                const terraNodeUserData: TerraNodeUserData = {
                    isStruct: node.__TYPE === CXXTYPE.Struct,
                    isEnumz: node.__TYPE === CXXTYPE.Enumz,
                    isClazz: node.__TYPE === CXXTYPE.Clazz,
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


  export function mergeAllNodesToOneCXXFile(view :CXXFile[]): CXXFile{
    const allNodesFile = new CXXFile();
  
    view.forEach((cxxfile :CXXFile) => {
        
        allNodesFile.nodes = [
          ...allNodesFile.nodes,
          ...cxxfile.nodes
        ];

    });

    return allNodesFile;
  }