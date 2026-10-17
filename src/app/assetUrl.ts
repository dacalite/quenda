// SPDX-License-Identifier: EUPL-1.2

/** Images stored as paths inside the app (seed photos) are served under the app's base path. */
export const assetUrl = (url: string) =>
  /^(?:[a-z][a-z\d+.-]*:|\/)/i.test(url) ? url : `${import.meta.env.BASE_URL}${url}`;
