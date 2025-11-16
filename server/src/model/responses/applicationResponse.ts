import { ApplicationPopulatedDoc } from '../mongo/application';

export interface BundleResponse {
  platform: string;
  bundleId: string;
}

export interface MaintainerResponse {
  id: string;
  login: string;
  isOwner: boolean;
}

export interface ApplicationResponse {
  id: string;
  name: string;
  bundles: BundleResponse[];
  token: string;
  maintainers: MaintainerResponse[];
}

export function serializeApplication(app: ApplicationPopulatedDoc): ApplicationResponse {
  return {
    id: app._id.toString(),
    name: app.name,
    bundles: app.bundles.map(bundle => ({
      platform: bundle.platform,
      bundleId: bundle.bundleId,
    })),
    token: app.token,
    maintainers: app.maintainers.map(m => ({
      id: m._id.toString(),
      login: m.login,
      isOwner: m.isOwner,
    })),
  };
}

