<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="/WEB-INF/jsp/common/jspInit.jsp"%>
<!-- inject:css -->
<!-- endinject -->
<div id="rosterMain" class="" v-cloak>
    <div class="ds-flex flex-v headboard">
        <div class="title">{{ title }}</div>
        <div class="ds-flex wrap-wp filter">
            <div class="ds-flex flex-v fcontain">
                <div class="ftitle">Month</div>
                <div>
                    <b-form-select v-model="monthSelect" :options="monthSelectOptions" class="mb-3" />
                </div>
            </div>
            <div class="ds-flex flex-v fcontain">
                <div class="ftitle">Shop</div>
                <div>
                    <b-form-select v-model="shopSelect" :options="shopSelectOptions" class="mb-3" @input="changeShop" />
                </div>
            </div>
            <div class="ds-flex flex-v fcontain">
                <div class="ftitle">Staff</div>
                <div>
                    <b-form-select v-model="staffSelect" :options="staffSelectOptions" class="mb-3" @input="changeStaff" />
                </div>
            </div>
        </div>
        <div class="ds-flex control-contain">
            <div class="ds-flex align-center pack-center normal-btn-with-hover" @click="searchByTop">
                <i class="glyphicon glyphicon-search"></i>
                <span>SEARCH</span>
            </div>
        </div>
    </div>
    <div class="ds-flex flex-v bodyboard">
        <div class="ds-flex align-center pack-between heads">
            <div class="ds-flex align-center name headsBlock">{{ currentStaffName }}</div>
            <div class="ds-flex align-center dates">
                <div class="left-btn" @click="anMonthFetch('pre')"><i class="glyphicon glyphicon-triangle-left"></i></div>
                <div class="pasc">{{ currentMonth }}</div>
                <div class="right-btn" @click="anMonthFetch('next')"><i class="glyphicon glyphicon-triangle-right"></i></div>
            </div>
            <div class="ds-flex pack-end btns headsBlock">
                <div class="ds-flex pack-center align-center today normal-btn-with-hover" @click="anMonthFetch('now')">Today</div>
            </div>
        </div>
        <div class="ds-flex colums">
            <div class="ds-flex flex-v week">
                <div class="ds-flex head">
                    <div class="ds-flex align-center pack-center flex-1 weekevery" v-for="(item,index) in week">{{ item }}</div>
                </div>
                <div class="ds-flex dateBodyCon">
                    <div class="ds-flex flex-7 wrap-wp innerCon">
                        <div class="ds-flex flex-v flex-1 dvided" v-for="(item,index) in dateBody" :class="item.timeOut?'out':''">
                            <div class="ds-flex pack-end corner">{{ item.day }}</div>
                            <div class="ds-flex shopname">{{ item.shopName }}</div>
                            <div class="ds-flex shopname">{{ item.rosterDetailDescription }}</div>
                        </div>
                    </div>
                    <div class="ds-flex flex-1 flex-v dateBodySide">
                        <div class="ds-flex pack-center align-center eachEdit" v-for="(item,index) in editRow">
                            <div v-if="item.editable==1" class="ds-flex pack-center align-center normal-btn-with-hover" @click="editWeek(index)">
                                <i class="glyphicon glyphicon-pencil"></i>
                                <span>EDIT</span>
                            </div>
                            <div v-else class="ds-flex pack-center align-center normal-btn-with-hover-disable">
                                <i class="glyphicon glyphicon-pencil"></i>
                                <span>EDIT</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="ds-flex pack-center align-center dialog-mask" v-show="mask">
        <div class="ds-flex flex-v infoPanel">
            <div class="ds-flex pack-between align-center head">
                <div>{{ currentStaffName }}</div>
                <div class="remove-x" @click="hideMask"><i class="glyphicon glyphicon-remove"></i></div>
            </div>
            <div class="ds-flex flex-v infoColums">
                <div class="ds-flex pack-between align-center cum1">
                    <div class="" v-for="(item,index) in dialog.e_colums">{{ item }}</div>
                </div>
                <div class="ds-flex pack-between align-center cum2">
                    <div class="" v-for="(item,index) in dialog.colums">{{ item }}</div>
                </div>
            </div>
            <div class="ds-flex flex-v align-center clockColums">
                <div class="ds-flex align-center clockDived" v-for="(item,index) in week_clo">
                    <div class="manyInputTitle">{{ item }}</div>
                    <div class="input-group date form_time manyInputCon">
                        <b-form-select v-model="nowEdit[index].defaultShopId" :options="editData[index].shopList" :value="nowEdit[index].shopValue" class="mb-3" :disabled="nowEdit[index].timeOut?true:false" :class="nowEdit[index].timeOut?'off':''" @input="inputChangeShop(index)"/>
                    </div>
                    <div class="input-group date form_time manyInputCon">
                        <b-form-select v-model="nowEdit[index].defaultRoster" :options="returnRoster(editData[index].shopList,nowEdit[index].defaultShopId)" class="mb-3" :disabled="nowEdit[index].timeOut?true:false" :class="nowEdit[index].timeOut?'off':''" @input="setRowTime(index)"/>
                    </div>
                    <div class="input-group date form_time manyInputCon">
                        <b-form-select v-model="editTypeSelect[index]" :options="editTypeList" class="mb-3" :disabled="nowEdit[index].timeOut?true:false" :class="nowEdit[index].timeOut?'off':''"/>
                    </div>
                    <div class="input-group date form_time manyInputCon" :class="editTypeSelect[index]!='WORK_DAY' || nowEdit[index].timeOut?'off':''">
                        <input type="button" name="fromDate" class="form-control form-control-hang manyInput" size="16" :row="index" col="workingStartTime" :disabled="editTypeSelect[index]!='WORK_DAY'">
                        <span class="input-group-addon" id="fromDateSpan"><span class="glyphicon glyphicon-time"></span></span>
                    </div>
                    <div class="input-group date form_time manyInputCon" :class="editTypeSelect[index]!='WORK_DAY' || nowEdit[index].timeOut?'off':''">
                        <input type="button" name="fromDate" class="form-control form-control-hang manyInput" size="16" :row="index" col="workingEndTime" :disabled="editTypeSelect[index]!='WORK_DAY'">
                        <span class="input-group-addon" id="fromDateSpan"><span class="glyphicon glyphicon-time"></span></span>
                    </div>
                    <div class="input-group date form_time manyInputCon" :class="editTypeSelect[index]!='WORK_DAY' || nowEdit[index].timeOut?'off':''">
                        <input type="button" name="fromDate" class="form-control form-control-hang manyInput" size="16" :row="index" col="lunchStartTime" :disabled="editTypeSelect[index]!='WORK_DAY'">
                        <span class="input-group-addon" id="fromDateSpan"><span class="glyphicon glyphicon-time"></span></span>
                    </div>
                    <div class="input-group date form_time manyInputCon" :class="editTypeSelect[index]!='WORK_DAY' || nowEdit[index].timeOut?'off':''">
                        <input type="button" name="fromDate" class="form-control form-control-hang manyInput" size="16" :row="index" col="lunchEndTime" :disabled="editTypeSelect[index]!='WORK_DAY'">
                        <span class="input-group-addon" id="fromDateSpan"><span class="glyphicon glyphicon-time"></span></span>
                    </div>
                </div>
            </div>
            <div class="ds-flex pack-center panelControl">
                <div class="ds-flex pack-center align-center normal-btn-with-hover" @click="submitForm">SUBMIT</div>
            </div>
        </div>
    </div>
</div>
<!-- inject:js -->
<!-- endinject -->