CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.order_lines FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');


