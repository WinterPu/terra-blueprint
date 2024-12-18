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
  genGeneralTerraData,
  FilterTerraNodeFunction,
  UESDK_GetFailureReturnVal,
  mergeAllNodesToOneCXXFile,
} from './utility/helper';

import {
  CXXFileUserData,
  ClazzMethodUserData,
  ParameterUserData,
  TerraNodeUserData,
} from './utility/additional_parsedata';

import {
  PrintStageLog,
} from './utility/logger';

// prepare terra data for rendering

export function prepareTerraData(
  terraContext: TerraContext,
  args: any,
  parseResult: ParseResult
): any {

  const func_node_filter : FilterTerraNodeFunction = (cxxfile: CXXFile) =>{
            // 筛选Node: IRtcEngine
          let nodes = cxxfile.nodes.filter((node: CXXTerraNode) => {
              return node.__TYPE === CXXTYPE.Clazz && (node.name === 'IRtcEngine' || node.name == "IRtcEngineEx");
          });
          return nodes;
  }

  let view = genGeneralTerraData(terraContext,args,parseResult,func_node_filter);

  return mergeAllNodesToOneCXXFile(view);
}


// call api to render 
export default function (
  terraContext: TerraContext,
  args: any,
  parseResult: ParseResult
): RenderResult[] {

  let name_renderer = __filename;
  PrintStageLog(name_renderer);

  let view = prepareTerraData(terraContext,args,parseResult);

  const one_render_config : MustacheRenderConfiguration = {

    fileNameTemplatePath: path.join(
      __dirname,
      '..',
      'templates',
      'cppplugin',
      'AgoraUERtcEngine_filename.mustache'
    ),
    fileContentTemplatePath: path.join(
      __dirname,
      '..',
      'templates',
      'cppplugin',
      'AgoraUERtcEngine_filecontent.mustache'
    ),
    view,
  };

  return renderWithConfiguration(one_render_config);

}
