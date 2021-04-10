import {Prisma, PrismaClient} from '.prisma/client';
import {Application, Binding, BindingKey} from '@loopback/core';
import {expect, sinon} from '@loopback/testlab';
import assert from 'assert';
import {PrismaComponent} from '../..';
import {asPrismaBinding} from '../../helpers';

describe('Prisma Component', () => {
  let app: Application;

  beforeEach(() => {
    app = new Application();
  });

  it('calls PrismaClient.$connect() during lifecycle start', async () => {
    const prismaClientStub = sinon.stub(new PrismaClient());
    const component = new PrismaComponent(
      app,
      (<unknown>prismaClientStub) as PrismaClient,
    );
    await component.init();
    await component.start();
    assert(prismaClientStub.$connect.calledOnce);
  });

  it('does not call PrismaClient.$connect during lifecycle start when lazyConnect = true', async () => {
    const prismaClientStub = sinon.stub(new PrismaClient());
    const component = new PrismaComponent(
      app,
      (<unknown>prismaClientStub) as PrismaClient,
      {
        lazyConnect: true,
      },
    );
    await component.init();
    await component.start();
    assert(prismaClientStub.$connect.notCalled);
  });

  it('calls PrismaClient.$disconnect during lifecycle stop', async () => {
    const prismaClientStub = sinon.stub(new PrismaClient());
    const component = new PrismaComponent(
      app,
      (<unknown>prismaClientStub) as PrismaClient,
    );
    await component.init();
    await component.stop();
    assert(prismaClientStub.$disconnect.calledOnce);
  });

  it('registers and locks Prisma middleware binding backlog and futures through event listener', async () => {
    const prismaClientStub = sinon.stub(new PrismaClient());
    const bindingPreInit1 = givenBlankPrismaMiddlewareBinding();
    const bindingPreInit2 = givenBlankPrismaMiddlewareBinding();
    const bindingPreStart1 = givenBlankPrismaMiddlewareBinding();
    const bindingPreStart2 = givenBlankPrismaMiddlewareBinding();
    const bindingPreStop1 = givenBlankPrismaMiddlewareBinding();
    const bindingPreStop2 = givenBlankPrismaMiddlewareBinding();
    const bindingPostStop1 = givenBlankPrismaMiddlewareBinding();
    const bindingPostStop2 = givenBlankPrismaMiddlewareBinding();

    app.add(bindingPreInit1);
    app.add(bindingPreInit2);

    expect(!bindingPreInit1.isLocked);
    expect(!bindingPreInit2.isLocked);

    const component = new PrismaComponent(
      app,
      (<unknown>prismaClientStub) as PrismaClient,
    );

    expect(app.listeners);
    expect(prismaClientStub.$use.notCalled);
    expect(!bindingPreInit1.isLocked);
    expect(!bindingPreInit2.isLocked);

    await component.init();

    expect(prismaClientStub.$use.callCount).to.be.equal(2);
    expect(bindingPreInit1.isLocked);
    expect(bindingPreInit2.isLocked);

    app.add(bindingPreStart1);
    app.add(bindingPreStart2);

    expect(prismaClientStub.$use.callCount).to.be.equal(4);
    expect(bindingPreStart1.isLocked);
    expect(bindingPreStart2.isLocked);

    await component.start();

    app.add(bindingPreStop1);
    app.add(bindingPreStop2);

    expect(prismaClientStub.$use.callCount).to.be.equal(6);
    expect(bindingPreStop1.isLocked);
    expect(bindingPreStop2.isLocked);

    await component.stop();
    app.add(bindingPostStop1);
    app.add(bindingPostStop2);

    expect(prismaClientStub.$use.callCount).to.be.equal(8);
    expect(bindingPostStop1.isLocked);
    expect(bindingPostStop2.isLocked);
  });

  it('Sets isInitialized after init() is called.', async () => {
    const prismaClientStub = sinon.stub(new PrismaClient());
    const component = new PrismaComponent(
      app,
      (<unknown>prismaClientStub) as PrismaClient,
    );
    await component.init();
    assert(component.isInitialized === true);
  });
});

function givenBlankPrismaMiddlewareBinding() {
  return new Binding<Prisma.Middleware>(BindingKey.generate())
    .apply(asPrismaBinding)
    .to(async (params, next) => {});
}
