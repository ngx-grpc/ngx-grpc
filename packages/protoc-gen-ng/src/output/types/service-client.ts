import { Proto } from '../../input/proto';
import { ProtoService } from '../../input/proto-service';
import { Services } from '../../services';
import { ExternalDependencies } from '../misc/dependencies';
import { Printer } from '../misc/printer';
import { ServiceClientConfig } from './service-client-config';
import { ServiceClientMethod } from './service-client-method';

export class ServiceClient {

  constructor(
    private proto: Proto,
    private service: ProtoService,
    private serviceClientConfig: ServiceClientConfig,
  ) { }

  print(printer: Printer) {
    Services.Logger.debug(`Start printing service client ${this.service.name} in proto ${this.proto.name}`);

    const tokenName = this.serviceClientConfig.getTokenName();

    printer.addDeps(
      ExternalDependencies.GrpcClient,
      ExternalDependencies.GrpcHandler,
      ExternalDependencies.Inject,
      ExternalDependencies.Injectable,
      ExternalDependencies.Optional,
      ExternalDependencies.GrpcClientFactory,
      ExternalDependencies.GRPC_CLIENT_FACTORY,
    );

    const serviceId = (this.proto.pb_package ? this.proto.pb_package + '.' : '') + this.service.name;

    const providedIn = Services.Config.files.pbsc.serviceClientProvidedIn;
    const injectable = providedIn === 'none' ? '' : `{ providedIn: '${providedIn}' }`;

    printer.add(`
      /**
       * Service client implementation for ${serviceId}
       */
      @Injectable(${injectable})
      export class ${this.service.name}Client {

        private client: GrpcClient<any>;

        constructor(
          @Optional() @Inject(${tokenName}) settings: any,
          @Inject(GRPC_CLIENT_FACTORY) clientFactory: GrpcClientFactory<any>,
          private handler: GrpcHandler,
        ) {
          this.client = clientFactory.createClient('${serviceId}', settings);
        }
    `);

    this.service.methodList.map(method => {
      const serviceClientMethod = new ServiceClientMethod(this.proto, this.service, method);

      serviceClientMethod.print(printer);

      printer.newLine();
      printer.newLine();
    });

    printer.add('}');

    Services.Logger.debug(`End printing service client ${this.service.name} in proto ${this.proto.name}`);
  }

}
