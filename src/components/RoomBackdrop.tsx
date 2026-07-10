import { PixelRoomBackdrop, type RoomKind } from "./PixelRoomBackdrop";

interface RoomBackdropProps {
  kind: RoomKind;
  seed?: string;
}

export function RoomBackdrop({ kind, seed }: RoomBackdropProps) {
  return <PixelRoomBackdrop kind={kind} seed={seed} />;
}
