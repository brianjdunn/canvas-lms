# frozen_string_literal: true

require 'set'

#DumpHelper.find_dump_error(viewer)
module DumpHelper
  class << self
    def find_dump_error(val, key = "val", __visited_dump_vars = Set.new)
      return if __visited_dump_vars.include?(val.object_id)

      __visited_dump_vars << val.object_id

      Marshal.dump(val)
    rescue TypeError
      if val.is_a?(Proc)
        raise TypeError, "#{key}: #{$!}"
      end
      if $!.message == "singleton can't be dumped" && !val.singleton_methods.empty?
        raise TypeError, "#{key}: singleton can't be dumped (#<#{val.class}>): #{val.singleton_methods.inspect}"
      end
      if val.is_a?(Hash) && val.default_proc
        raise TypeError, "#{key}: can't dump hash with default proc: #{val.default_proc.inspect}"
      end

      # see if anything inside val can't be dumped...
      if val.respond_to?(:marshal_dump, true)
        find_dump_error(val.marshal_dump, "#{key}.marshal_dump", __visited_dump_vars)
      elsif val.respond_to?(:_dump, true)
        stringval = val._dump(-1)
        if stringval.instance_variables.empty?
          dump_ivars(val, "#{key}._dump", __visited_dump_vars)
        else
          dump_ivars(stringval, "#{key}._dump", __visited_dump_vars)
        end
      else
        dump_ivars(val, key, __visited_dump_vars)

        if val.is_a?(Hash)
          find_dump_error(val.keys, "#{key}.keys", __visited_dump_vars)
        end
        if val.is_a?(Hash)|| val.is_a?(Struct)
          val.each_pair do |k, v|
            find_dump_error(v, "#{key}[#{k.inspect}]", __visited_dump_vars)
          end
        elsif val.is_a?(Array)
          val.each_with_index do |v, i|
            find_dump_error(v, "#{key}[#{i}]", __visited_dump_vars)
          end
        end
      end
    end

    private

    def dump_ivars(val, key, __visited_dump_vars)
      val.instance_variables.each do |k|
        v = val.instance_variable_get(k)
        find_dump_error(v, "#{key}.instance_variable_get(#{k.inspect})", __visited_dump_vars)
      end
    end
  end
end
