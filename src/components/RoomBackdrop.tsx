import { HudRoomBackdrop, type HudRoomKind } from "./HudRoomBackdrop";
import { PixelRoomBackdrop } from "./PixelRoomBackdrop";

interface RoomBackdropProps {
  kind: HudRoomKind;
  seed?: string;
}

export function RoomBackdrop({ kind, seed }: RoomBackdropProps) {
  return (
    <>
      <HudRoomBackdrop kind={kind} seed={seed} />
      <PixelRoomBackdrop kind={kind} seed={seed} />
    </>
  );
}
