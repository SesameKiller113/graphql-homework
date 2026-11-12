import { useEngine } from '@envelop/core';
import type { Plugin } from 'graphql-yoga';
import { parse, validate, specifiedRules, execute, subscribe } from 'graphql';
import { useParserCache } from '@envelop/parser-cache';
import { useValidationCache } from '@envelop/validation-cache';
import { buildHeaders } from './buildHeaders';
import { useLogger } from './useLogger';
import { useClientHeader } from './useClientHeader';
import { useResponseMetadata } from './useResponseMetadata';
import { ContextType } from '../types';

const plugins: Plugin<ContextType>[] = [
  useEngine({ parse, validate, specifiedRules, execute, subscribe }) as Plugin<ContextType>,
  useClientHeader(),
  buildHeaders(),
  useLogger(),
  useParserCache() as Plugin<ContextType>,
  useValidationCache() as Plugin<ContextType>,
  useResponseMetadata(),
];

export default plugins;
