module PurchaseRequest
  require 'securerandom'
  require 'thread'
  module PurchaseRequests
    LOCK=Mutex.new
    WORKSPACES={}
    def self.reset(key) = LOCK.synchronize { WORKSPACES.delete(key) }

    def self.workspace(key)
      LOCK.synchronize {(WORKSPACES[key] ||= {drafts:{},records:{},fail_next:false}).deep_dup}
    end
    def self.start(key)
      LOCK.synchronize do
        id=SecureRandom.uuid
        WORKSPACES.fetch(key)[:drafts][id]={values:PurchaseEntry.new.values,revision:0,review:nil,record_id:nil}
        id
      end
    end
    def self.preview(key,id,version,entry)
      LOCK.synchronize do
        draft=WORKSPACES.fetch(key)[:drafts][id]
        return :expired unless draft
        return :created if draft[:record_id]
        return :stale unless draft[:revision].to_s==version.to_s
        draft[:values]=entry.values;draft[:revision]+=1
        draft[:review]=entry.valid? ? entry.canonical : nil
        draft[:review] ? :ready : :invalid
      end
    end
    def self.create(key,id,version)
      LOCK.synchronize do
        store=WORKSPACES.fetch(key);draft=store[:drafts][id]
        return :expired unless draft
        return :created if draft[:record_id]
        return :stale unless draft[:review] && draft[:revision].to_s==version.to_s
        if store[:fail_next]
          store[:fail_next]=false;return :failure
        end
        record_id=store[:records].size+1
        store[:records][record_id]=draft[:review].merge(id:record_id)
        draft[:record_id]=record_id
        :created
      end
    end
    def self.fail_next(key)
      LOCK.synchronize {WORKSPACES.fetch(key)[:fail_next]=true}
    end
  end
end
