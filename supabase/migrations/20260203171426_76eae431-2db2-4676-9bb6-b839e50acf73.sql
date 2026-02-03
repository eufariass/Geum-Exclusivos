-- 1. Function to reorder site sections
CREATE OR REPLACE FUNCTION reorder_site_sections(section_ids UUID[])
RETURNS VOID AS $$
DECLARE
  section_id UUID;
  new_index INTEGER;
BEGIN
  -- Check if array is not null
  IF section_ids IS NULL THEN
    RETURN;
  END IF;

  -- Iterate through the array and update order_index
  FOR i IN 1..array_length(section_ids, 1) LOOP
    new_index := i - 1; -- 0-based index
    section_id := section_ids[i];
    UPDATE site_sections
    SET order_index = new_index
    WHERE id = section_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Function to reorder site banners
CREATE OR REPLACE FUNCTION reorder_site_banners(banner_ids UUID[])
RETURNS VOID AS $$
DECLARE
  banner_id UUID;
  new_index INTEGER;
BEGIN
  IF banner_ids IS NULL THEN
    RETURN;
  END IF;

  FOR i IN 1..array_length(banner_ids, 1) LOOP
    new_index := i - 1;
    banner_id := banner_ids[i];
    UPDATE site_banners
    SET order_index = new_index
    WHERE id = banner_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;