import path from 'path';

import { CXXTerraNode } from '@agoraio-extensions/cxx-parser';

import { AGORA_MUSTACHE_DATA } from './blueprint_special/bptype_mustache_data';

const regMap: { [key: string]: string } = {
  isCallback: '.*(Observer|Handler|Callback|Receiver|Sink).*',
};

export function isMatch(str: string, type: string): boolean {
  let result = false;
  if (regMap[type]) {
    result = new RegExp(regMap[type]).test(str);
  }
  return result;
}

export function convertTypeNameToNodeName(input: string): string {
  if (!input) return input; // handle undefined
  return removeNamespace(input);
}

export function removeNamespace(input: string): string {
  if (!input) return input; // handle undefined
  // use regular expression to remove namespace
  return input.replace(/.*::/, '');
}

export function isNullOrEmpty(str: string | null | undefined): boolean {
  // including whitespace
  return str === null || str === undefined || str.trim() === '';
}

export function addOneLine_Format(
  line: string,
  prefix_indent: string = ''
): string {
  return prefix_indent + line + '\n';
}

export function IsNotEmptyStr(str: string): boolean {
  return str !== null && str !== undefined && str.trim() !== '';
}

export function IsOptionalUABTType(type: string): boolean {
  return type.startsWith(AGORA_MUSTACHE_DATA.FUABT_OPT_PREFIX);
}

export function extractFileName(file_path: string): string {
  return path.basename(file_path, path.extname(file_path));
}

export function extractBracketNumber(input: string): string {
  const match = input.match(/\[(\d+)\]/);
  return match ? match[1] : '';
}
