import * as path from 'path';

import { CXXFile, CXXTYPE, CXXTerraNode } from '@agoraio-extensions/cxx-parser';
import {
  ParseResult,
  RenderResult,
  TerraContext,
} from '@agoraio-extensions/terra-core';

import {
  IrisApiIdParserUserData,
  renderWithConfiguration,
} from '@agoraio-extensions/terra_shared_configs';

type CXXFileUserData = {
  fileName: string;
};

type TerraNodeUserData = {
    isStruct: boolean;
    isEnumz: boolean;
    isClazz: boolean;
    isCallback: boolean;
    hasBaseClazzs: boolean;
    hasSupportApi: boolean;
    prefix_name: string;
};

export default function (
  terraContext: TerraContext,
  args: any,
  parseResult: ParseResult
): RenderResult[] {
  let cxxfiles = parseResult.nodes as CXXFile[];
  let view = cxxfiles.map((cxxfile: CXXFile) => {
    const cxxUserData: CXXFileUserData = {
      fileName: path.basename(
        cxxfile.file_path,
        path.extname(cxxfile.file_path)
      ),
    };
    cxxfile.user_data = cxxUserData;

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
  
  return renderWithConfiguration({
    fileNameTemplatePath: path.join(
      __dirname,
      '..',
      'templates',
      'type',
      'file_name.mustache'
    ),
    fileContentTemplatePath: path.join(
      __dirname,
      '..',
      'templates',
      'type',
      'file_content.mustache'
    ),
    view,
  });
}
