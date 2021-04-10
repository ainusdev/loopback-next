import {Binding, BindingScope, extensionFor} from '@loopback/core';
import {PrismaBindings} from '../keys';

export function asPrismaBinding(binding: Binding) {
  return binding
    .apply(extensionFor(PrismaBindings.PRISMA_MIDDLEWARE_EXTENSION_POINT))
    .inScope(BindingScope.SINGLETON);
}
