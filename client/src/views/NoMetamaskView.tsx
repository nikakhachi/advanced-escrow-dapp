export const NoMetamaskView = () => (
  <div className="w-full justify-center items-center flex flex-col pt-24 text-white">
    <p className="text-2xl">Metamask Wallet is Missing</p>
    <p className="text-2xl mt-2 mb-4">
      Please install the{" "}
      <a
        className="underline"
        href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn"
        target="_blank"
        rel="noreferrer"
      >
        metamask extenstion
      </a>{" "}
      and refresh this page
    </p>
  </div>
);
