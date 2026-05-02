/**
 * CRC16-CCITT-FALSE: poly=0x1021, init=0xFFFF, no reflection, no XOR-out.
 * Used by the PIX BR-Code spec for the trailing "63" field.
 */
export function crc16ccitt(buf: Buffer | Uint8Array): number {
  let crc = 0xffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i] << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc & 0xffff;
}
