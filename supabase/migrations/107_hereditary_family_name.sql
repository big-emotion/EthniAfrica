-- Migration 107: hereditary_family_name joins the naming systems of a name
-- REQ-133. ETNI-2011.
--
-- The five naming systems of migration 053 had no box for a surname that is
-- hereditary and is neither a clan or lineage name, a nisba, a praise name,
-- a totemic clan nor a non-hereditary patronymic: a given name, a title or a
-- patronymic element that became a family name (Maghreb Ben/Bou names,
-- Portuguese baptismal surnames, Akan day names carried down in a family).
-- Fiches in that case were typed with the nearest box and a gap saying so.
--
-- This migration only widens the enum; it rewrites no row. Fiches are
-- retyped by the next corpus load from dataset/source/afrik/patronymes/.
-- ADD VALUE cannot be used in the transaction that adds it, so nothing here
-- reads or writes the new value. migrations 066 and 069 carry name_system
-- through as text and need no change. Idempotent.

ALTER TYPE name_system_type ADD VALUE IF NOT EXISTS 'hereditary_family_name';

COMMENT ON TYPE name_system_type IS
  'The nameSystem discriminant (DEC-039): clan_name (Manding jamu, Xhosa '
  'isiduko, western Fulɓe clans), non_hereditary_patronymic (Ethiopian and '
  'Eritrean, eastern Fulɓe), nisba (Arabo-Berber tribal sense), praise_name '
  '(Yoruba oríkì, Nguni izibongo), totemic_clan (Baganda ekika closed list), '
  'hereditary_family_name (a given name, title or patronymic element that '
  'became a hereditary surname). ETNI-1454, ETNI-2011.';
