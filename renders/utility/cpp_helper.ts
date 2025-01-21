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
import { map } from 'lodash';

export function formatAsCppComment(input: string): string {
  // 去掉首尾空格和换行
  const trimmedInput = input.trim();

  // 将每行前加 *，并包裹在 /* 和 */
  const commentLines = trimmedInput
    .split('\n')
    .map((line) => ` * ${line}`)
    .join('\n');

  return `/*\n${commentLines}\n */`;
}

export function prettyDefaultValue(
  parseResult: ParseResult,
  defaultValueType: SimpleType,
  defaultValue: string
): string {
  let out = defaultValue;
  if (defaultValue.length == 0) {
    return out;
  }
  let tmpDefaultValueNode = parseResult.resolveNodeByType(defaultValueType);
  if (
    tmpDefaultValueNode.__TYPE == CXXTYPE.Struct ||
    tmpDefaultValueNode.__TYPE == CXXTYPE.Clazz
  ) {
    out = `${tmpDefaultValueNode.fullName}()`;
  } else if (tmpDefaultValueNode.__TYPE == CXXTYPE.Enumz) {
    let tmpName = defaultValue
      .replaceAll('(', '')
      .replaceAll(')', '')
      .split('::')
      .pop();
    out = `${tmpDefaultValueNode.fullName}::${tmpName}`;
  }

  if (out == '__null') {
    out = 'nullptr';
  }

  return out;
}

export function createCompilationDirectivesContent(
  node: CXXTerraNode,
  isStart: boolean = true
): string {
  let directives = node.conditional_compilation_directives_infos;
  if (directives.length == 0) {
    return '';
  }

  let startIf = directives.join('\n');
  if (isStart) {
    return startIf;
  }

  let endIf = directives.map((it) => '#endif').join('\n');

  return endIf;
}
