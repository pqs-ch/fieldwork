Rails.application.routes.draw do
  root to: 'review#index'
  get 'review/:slug', to: 'review#show', as: :review_example
  get 'review/:slug/reset', to: 'review#reset', as: :reset_review_example
  post 'review/:slug/reset', to: 'review#restart'

  namespace :application_layout, path: "application-layout" do
    root to: redirect('/application-layout/projects')
    get '/projects', to: 'workspace#projects'
    get '/people', to: 'workspace#people'
    get '/account', to: 'workspace#account'
    get '/workplace', to: redirect('/application-layout/workplace/requests')
    get '/workplace/requests', to: 'workspace#requests'
    get '/workplace/scheduled', to: 'workspace#scheduled'
    get '/workplace/equipment', to: 'workspace#equipment'
  end

  namespace :draft_protection, path: "draft-protection" do
    root to: 'workbench#show'
    get 'workbench', to: 'workbench#show'
    get 'workspace', to: 'workbench#workspace'
    get 'reference', to: 'workbench#reference'
    post 'brief', to: 'workbench#save'
  end

  namespace :event_times, path: "event-times" do
    root to: redirect('/event-times/events')
    resources :events, only: [:index, :new, :create, :show] do
      collection do
        post :preview
        get :review
      end
    end
    get 'scenarios', to: 'scenarios#show'
    post 'scenarios', to: 'scenarios#create'
  end

  namespace :file_import, path: "file-import" do
    root to: redirect('/file-import/imports')
    resources :imports, only: [:index, :new, :create, :show] do
      collection { get :sample }
      member do
        get :mapping
        post :mapping, action: :save_mapping
        get :review
        post :execute
        post :retry_failed
        get :scenarios
        post :scenario
      end
    end
  end

  namespace :mixed_forms, path: "mixed-forms" do
    root to: redirect("/mixed-forms/mixed-form")
    get "/mixed-form", to: "mixed_forms#edit"
    post "/mixed-form", to: "mixed_forms#update"
    post "/mixed-form/fail-next", to: "mixed_forms#fail_next"
    get "/mixed-form/people", to: "mixed_forms#people"
    get "/mixed-form/other", to: "mixed_forms#other"
  end

  namespace :multi_step_creation, path: "multi-step-creation" do
    root to: redirect('/multi-step-creation/requests')
    resources :requests, only: [:index, :show, :create]
    resources :drafts, only: [:create] do
      member do
        get :details
        post :details, action: :save_details
        get :scope
        post :scope, action: :save_scope
        get :review
        get :scenarios
        post :scenario
      end
    end
  end

  namespace :operations, path: "operations" do
    get 'work', to: 'work#index', as: :work_index
    get 'work/views/new', to: 'work#new_view', as: :new_work_view
    get 'work/views', to: 'work#settings', as: :work_settings
    get 'work/views/delete', to: 'work#deletion', as: :work_view_deletion
    get 'work/scenarios', to: 'work#scenarios', as: :work_scenarios
    post 'work/views', to: 'work#save_view', as: :work_views
    post 'work/views/rename', to: 'work#rename_view', as: :rename_work_view
    post 'work/views/delete', to: 'work#delete_view', as: :delete_work_view
    post 'work/default', to: 'work#make_default', as: :work_default
    post 'work/scenario', to: 'work#scenario', as: :work_scenario
    get 'work/:id', to: 'work#show', as: :work_task
    post 'work/:id/complete', to: 'work#complete', as: :complete_work_task
    root to: redirect('/operations/projects')
    resources :projects, only: [:index, :show, :edit, :update, :new, :create]
  end

  namespace :population_review, path: "population-review" do
    root to: redirect('/population-review/reviews')
    resources :reviews, only: [:index, :show] do
      member do
        post :start
        get :completion
        post :complete
      end
      get 'inputs/:input_id/evidence/new', to: 'review_evidence#new', as: :new_evidence
      post 'inputs/:input_id/evidence', to: 'review_evidence#create', as: :evidence
      get 'inputs/:input_id/evidence/:use_id/removal', to: 'review_evidence#removal', as: :evidence_removal
      post 'inputs/:input_id/evidence/:use_id/remove', to: 'review_evidence#remove', as: :remove_evidence
      get 'inputs/:input_id/comparison', to: 'reviews#comparison', as: :comparison
      get 'inputs/:input_id', to: 'reviews#details', as: :input
      get 'inputs/:input_id/assessment', to: 'reviews#assessment', as: :assessment
      post 'inputs/:input_id/assessment', to: 'reviews#record_assessment'
      get 'inputs/:input_id/finding', to: 'reviews#finding', as: :finding
      post 'inputs/:input_id/finding', to: 'reviews#record_finding'
    end
    resources :evidence, only: [:index, :show] do
      member do
        get :download
        get :withdrawal
        post :withdraw
      end
    end
    get 'scenarios', to: 'scenarios#show'
    post 'scenarios', to: 'scenarios#create'
  end

  namespace :purchase_request, path: "purchase-request" do
    root to: redirect('/purchase-request/purchases')
    resources :purchases, only: [:index, :new, :create, :show] do
      collection do
        post :preview
        get :review
        get :scenarios
        post :scenario
      end
    end
    get 'suppliers', to: 'suppliers#index'
    get 'suppliers/options', to: 'suppliers#options'
    post 'suppliers/refresh', to: 'suppliers#refresh'
  end

  namespace :record_activities, path: "record-activities" do
    root to: redirect('/record-activities/requests')
    resources :requests, only: [:index, :show] do
      resources :activities, only: [:new, :create]
    end
  end

  namespace :versioned_documents, path: "versioned-documents" do
    root to: redirect("/versioned-documents/documents/example/compare?earlier=r2&later=r4")
    get "/documents/example", to: "document_examples#read"
    get "/documents/example/read", to: "document_examples#read"
    get "/documents/example/compare", to: "document_examples#compare"
    get "/documents/example/edit", to: "document_examples#edit"
    post "/documents/example/save", to: "document_examples#update"
    get "/documents/example/history", to: "document_examples#history"
    post "/documents/example/restore", to: "document_examples#restore"
  end
end
