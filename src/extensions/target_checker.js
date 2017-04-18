/**
 * @fileoverview TargetChecker for courseware.
 */
'use strict';

goog.provide("Entry.TargetChecker");

goog.require("Entry.Utils");
goog.require("Entry.Extension");

/**
 * @constructor
 */
Entry.TargetChecker = function(code, isForEdit) {
    this.isForEdit = isForEdit;
    this.goals = [];
    this.publicGoals = [];
    this.unachievedGoals = [];
    this.remainPublicGoal = 0;
    if (this.isForEdit) {
        this.watchingBlocks = [];
        Entry.playground.mainWorkspace.blockMenu.unbanClass("checker");
        Entry.addEventListener("run", this.reRegisterAll.bind(this));
    }

    this.isFail = false;
    this.isSuccess = false;

    this.entity = this;
    this.parent = this;

    Entry.achieveEvent = new Entry.Event();
    Entry.addEventListener("stop", this.reset.bind(this));

    Entry.registerAchievement = this.registerAchievement.bind(this);
    this.script = new Entry.Code(code ? code : [], this);
    Entry.targetChecker = this;
};

Entry.Utils.inherit(Entry.Extension, Entry.TargetChecker);

(function(p) {
    p.renderView = function() {
        this._view = Entry.Dom('li', {
            class: "targetChecker"
        });

        this._view.bindOnClick(function(e) {
            Entry.playground.injectObject(this);
        }.bind(this));
        this.updateView();
        if (!this.isForEdit)
            this._view.addClass("entryRemove");
        return this._view;
    };

    p.generateStatusView = function(isForIframe) {
        this._statusView = Entry.Dom('div', {
            class: "entryTargetStatus"
        });
        var innerWrapper = Entry.Dom('div', {
            class: "innerWrapper",
            parent: this._statusView
        });
        this._statusViewIndicator = Entry.Dom('div', {
            class: "statusIndicator",
            parent: innerWrapper
        });
        var statusViewContentWrapper = Entry.Dom('div', {
            class: "statusMessage",
            parent: innerWrapper
        });
        this._statusViewContent = Entry.Dom('p', {
            parent: statusViewContentWrapper
        });
        if (isForIframe) {
            $(Entry.view_).addClass("iframeWithTargetStatus")
            Entry.view_.append(this._statusView[0]);
        }
        this.updateView();
        this.showDefaultMessage();
    };

    p.updateView = function() {
        if (this._view) {
            var len = this.goals.length;
            var publicLen = this.publicGoals.length;
            this._view.text("목표 : " + (len - this.unachievedGoals.length) +
                            " / " + len + " , 공식 목표 : " +
                           (publicLen - this.remainPublicGoal) + " / " + publicLen);
            if (this.isSuccess)
                this._view.addClass("success");
            else
                this._view.removeClass("success");
            if (this.isFail)
                this._view.addClass("fail");
            else
                this._view.removeClass("fail");
        }
        if (this._statusView) {
            var publicLen = this.publicGoals.length;
            this._statusViewIndicator.text(
                (publicLen - this.remainPublicGoal) +
                    "/" + publicLen
            )
        }
    };

    p.getStatusView = function() {
         if (!this._statusView)
             this.generateStatusView();
         return this._statusView;
    }

    p.showStatusMessage = function(message) {
        if (this._statusViewContent && !this.isFail)
            this._statusViewContent.text(message);
    };

    p.achieveCheck = function(isSuccess, id) {
        if (this.isFail || !Entry.engine.achieveEnabled)
            return;
        if (isSuccess)
            this.achieveGoal(id);
        else
            this.fail(id);
    };

    p.achieveGoal = function(id) {
        if (this.isSuccess || this.isFail || this.unachievedGoals.indexOf(id) < 0)
            return;
        this.unachievedGoals.splice(this.unachievedGoals.indexOf(id), 1);
        if (this.publicGoals.indexOf(id) > -1)
            this.remainPublicGoal--;
        if (this.unachievedGoals.length === 0) {
            this.isSuccess = true;
            Entry.achieveEvent.notify("success", id);
        }
        this.updateView()
    };

    p.fail = function(id) {
        if (this.isSuccess || this.isFail)
            return;
        this.showStatusMessage(id);
        this.isFail = true;
        Entry.achieveEvent.notify("fail", id);
        this.updateView();
    };

    p.reset = function() {
        this.unachievedGoals = this.goals.concat();
        this.remainPublicGoal = this.publicGoals.length;
        this.isFail = false;
        this.isSuccess = false;
        this.updateView();
        this.showDefaultMessage();
    };

    p.showDefaultMessage = function() {
        this.showStatusMessage("프로젝트를 실행해 봅시다.");
    };

    p.checkGoal = function(goalName) {
        return this.goals.indexOf(goalName) > -1 &&
            this.unachievedGoals.indexOf(goalName) < 0;
    };

    p.registerAchievement = function(block) {
        if (this.isForEdit)
            this.watchingBlocks.push(block);
        if (block.params[1] && this.goals.indexOf(block.params[0] + "") < 0) {
            this.goals.push(block.params[0] + "");
            this.publicGoals.push(block.params[0] + "");
            this.remainPublicGoal = this.publicGoals.length;
        }
        this.reset();
    };

    p.reRegisterAll = function() {
        var blocks = this.script.getBlockList(false, "check_lecture_goal");
        this.watchingBlocks = blocks;
        this.goals = _.uniq(
            blocks.filter(function(b) {return b.params[1] === 1})
                  .map(function(b) {return b.params[0] + ""})
        );
        this.publicGoals = _.uniq(
            blocks.filter(function(b) {return b.params[1] === 1 && b.params[2] === 1})
                  .map(function(b) {return b.params[0] + ""})
        );
        this.remainPublicGoal = this.publicGoals.length;
    };

    p.clearExecutor = function() {
        this.script.clearExecutors();
    };

    p.destroy = function() {
        this.reset();
        Entry.achieveEvent.clear();
        this.script.destroy();
        $(this._view).remove();
    };


})(Entry.TargetChecker.prototype);
