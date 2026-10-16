import { Provider } from "@/types";
import { DocumentThumbnail } from "./DocumentThumbnail";

export function IdProofThumbnail({ provider }: { provider: Provider }) {
  return (
    <DocumentThumbnail
      providerName={provider.fullName}
      idType={provider.kyc.idType}
      idNumber={provider.kyc.idNumber}
      idDocumentImage={provider.kyc.idDocumentImage}
    />
  );
}
