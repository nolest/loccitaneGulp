
axios.defaults.headers.post['Content-Type'] = "application/json";
var env = '/loccitane';//'/loccitane';

var nroster = new Vue({
    el: "#rosterMain",
    data() {
        return {
            //首次进入设置搜索区域staff下拉触发加载，再次加载需要点击search按钮
            firstInit: true,
            title: 'Staff Roster',
            //顶部时间列表相关
            monthSelect: '',
            monthSelectOptions: [],
            //顶部商店列表相关
            shopSelect: '',
            shopSelectOptions: [],
            //顶部员工列表相关
            staffSelect: '',
            staffSelectOptions: [],
            //主体数据与缓存
            dateBody: [],
            dateBodyTemp: '',
            //当前编辑面板数据
            currentStaffName: '',
            currentStaffId: '',
            currentMonth: '',
            //日期渲染数据
            week: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', ''],
            week_clo: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            //面板日期渲染数据
            dialog: {
                e_colums: ['', '', '', '', 'Working Hours', '', 'Lunch', ''],
                colums: ['', 'Home Shop', 'Roster', 'Type', 'Start Time', 'End Time', 'Start Time', 'End Time']
            },
            //面板、蒙层状态控制
            mask: false,
            //编辑按钮显隐
            editRow: [{ editable: 0 }, { editable: 0 }, { editable: 0 }, { editable: 0 }, { editable: 0 }],
            //当前面板编辑对象
            nowEdit: [{ timeOut: 0 }, { timeOut: 0 }, { timeOut: 0 }, { timeOut: 0 }, { timeOut: 0 }, { timeOut: 0 }, { timeOut: 0 }],
            //面板商店数据
            homeShopList: [[], [], [], [], [], [], []],
            /**
             * @description 商店选择后v-model绑定商店id，对应7天
            */
            homeShopSelect: ["", "", "", "", "", "", ""],
            /**
             * @description roster的下拉列表，对应7天 
            */
            rosterEditList: [[], [], [], [], [], [], []],
            /**
             * @description roster选择后v-model绑定对象，接口value返回一个对象，对应7天
             * { workingStartTime,workingEndTime,lunchStartTime,lunchEndTime }
            */
            rosterEditSelect: [{}, {}, {}, {}, {}, {}, {}],
            /**
             * @description 类型选择列表，两种状态
             * 2019-1-21 添加五种状态,getShopAndRosterInfo接口输出
            */
            editTypeList: [],
            /**
             * @description 类型选择对象
            */
            editTypeSelect: ["", "", "", "", "", "", "",],
            /**
             * @description Edit整体数据，从服务器拉取，也是提交对象
            */
            editData: [{ shopList: [] }, { shopList: [] }, { shopList: [] }, { shopList: [] }, { shopList: [] }, { shopList: [] }, { shopList: [] }]
        }
    },
    watch: {
        homeShopSelect: {
            handler: function (newVal, oldVal) {
                console.log(newVal)
                console.log(oldVal)
            },
            deep: true
        }
    },
    mounted() {
        //拉取顶部状态
        this.fetchInit();
        //初始化jq时间插件<=万恶之源
        this.dateConfig();
    },
    methods: {
        /**
         * 
         * @param {array} shopList 
         * @param {string} shopDefault 
         */
        returnRoster(shopList, shopDefault) {
            if (!shopDefault) return
            let that = this;
            let rosterArr = [];
            for (let i = 0; i < shopList.length; i++) {
                if (shopDefault == shopList[i].value) {
                    rosterArr = shopList[i].rosterList;
                    //无默认值的话,按接口返回设置默认，否则按details接口设置的nowEdit优先
                    console.log(!that.nowEdit[i].defaultRoster)
                    console.log(shopList[i].rosterDefault)
                    if(!that.nowEdit[i].defaultRoster && shopList[i].rosterDefault){
                        that.setDefaultRoster(i,shopList[i].rosterDefault);
                    }
                }
            }
            return rosterArr;
        },
        /**
         * @description 设置默认值
         * @param {Number,String} nowEditDefaultRoster 
         */
        setDefaultRoster(index,defaultStr) {
            this.nowEdit[index].defaultRoster = defaultStr;
        },
        /**
         * @description 拉取顶部数据，首次渲染页面时调用
        */
        fetchInit() {
            let that = this;
            axios.post(env + '/staffRoster/searchFormInfo')
                .then(function (response) {
                    let monthList = response.data.messages.monthList;
                    let shopList = response.data.messages.shopList;
                    //设置列表
                    that.monthSelectOptions = monthList;
                    that.shopSelectOptions = shopList;
                    //设置默认值
                    that.shopSelect = response.data.messages.shopDefault;
                    that.monthSelect = response.data.messages.monthDefault;
                })
                .catch(function (response) {

                })
        },
        /**
         * @description 修改顶部shop下拉时触发
         * 更新拉取staff数据
        */
        changeShop() {
            let cur_id = this.shopSelect;
            let that = this;
            this.staffSelectOptions = [];
            axios.post(env + '/staff/staffListByShop', {
                "id": cur_id
            })
                .then(function (response) {
                    //设置员工列表及默认值
                    that.staffSelectOptions = response.data.messages.staffList;
                    that.staffSelect = that.staffSelectOptions[0].value;
                    //首次修改商店时加载
                    if (that.firstInit) {
                        that.fetchRosterForm({
                            calendarDate: that.monthSelect,
                            staffId: that.staffSelect,
                            shopId: that.shopSelect
                        });
                        that.firstInit = false
                    }
                })
                .catch(function (error) {

                })
        },
        /**
         * @description 顶部搜索
        */
        searchByTop() {
            let that = this;
            that.fetchRosterForm({
                calendarDate: that.monthSelect,
                staffId: that.staffSelect,
                shopId: that.shopSelect
            });
        },
        /**
         * @description 通用拉取大日历数据
         * @params {Object} 查询参数，为空时服务器也有返回
        */
        fetchRosterForm(data) {
            let that = this;
            console.log(data);
            let obj = data || {};
            that.dateBody = [];
            axios.post(env + '/staffRoster/staffRosterDetails', obj)
                .then(function (response) {
                    that.dateBody = response.data.messages.rosterDetailList;
                    that.currentStaffName = response.data.messages.staffName;
                    that.currentStaffId = response.data.messages.staffId;
                    that.pMonth = response.data.messages.previousMonth;
                    that.nMonth = response.data.messages.nextMonth;
                    that.nowMonth = response.data.messages.nowMonth;
                    that.currentMonth = response.data.messages.currentMonth;
                    //按钮状态计算		
                    that.calEditStat();
                })
                .catch(function (error) {

                })
        },
        /**
         * @decription 计算5个edit按钮状态
         * 每次拉取大列表时调用
        */
        calEditStat() {
            let that = this;
            let editNum = 5;
            let editJugeArr = [];
            //循环35个数据，分5组
            for (let i = 0; i < 5; i++) {
                let temp = that.dateBody.slice(i * 7, i * 7 + 7);
                editJugeArr.push(temp);
            }
            //循环5个分组
            let canEditArr = [];
            for (let i in editJugeArr) {
                //循环各个分组内的type
                let canEdit = false;
                for (let k in editJugeArr[i]) {
                    if (editJugeArr[i][k].timeOut == 0) {
                        canEdit = true || canEdit
                    }
                }
                //重置editable
                if (canEdit) {
                    that.editRow[i].editable = 1
                }
                else {
                    that.editRow[i].editable = 0
                }
            }
        },
        /**
         * @description 修改staff下拉时触发
         * 
        */
        changeStaff() {
            let sta_id = this.staffSelect;
        },
        /**
         * @description 多种方式拉取单月数据
         * 前一月，后一月，当前月
         * 
        */
        anMonthFetch(type) {
            let that = this;
            let date = '';
            switch (type) {
                case 'pre': date = that.pMonth; break;
                case 'now': date = that.nowMonth; break;
                case 'next': date = that.nMonth; break;
            }
            this.fetchRosterForm({
                calendarDate: date,
                staffId: that.currentStaffId,
                shopId: that.shopSelect
            });
        },
        /**
         * @description 显示蒙层
        */
        showMask() {
            this.mask = true;
        },
        /**
        * @description 隐藏蒙层，清除编辑数据、时间插件数据、重设日历对象
        */
        hideMask() {
            this.mask = false;
            this.clearEditData();
            this.clearAllEditTime();
            this.resetNowEditWhenClose();
        },
        /**
         * @description 缓存dateBody对象，submit之后需要清空该对象
        */
        resetNowEditWhenClose() {
            this.dateBody = JSON.parse(this.dateBodyTemp);
        },
        /**
         * @description 点击编辑按钮，生成编辑list
        */
        editWeek(index) {
            let that = this;
            if (!this.currentStaffId) {
                alert("You haven\'t choose a staff");
                return
            }
            let idx = index;
            //根据index截取大日历
            that.dateBodyTemp = JSON.stringify(this.dateBody);
            let goEditList = this.dateBody.slice(index * 7, index * 7 + 7);
            that.nowEdit = goEditList;

            //根据返回数据 设置type
            for (let i in that.editTypeSelect) {
                that.editTypeSelect[i] = goEditList[i].type
            }
            //拉取商店列表
            that.fetchEditData(() => {
                //数据获取设置成功后才显示面板
                that.showMask();
            });

        },
        /**
         * @description 拉取Edit整体数据,点击Edit时调用
        */
        fetchEditData(callback) {
            let that = this;
            //let rosterArr = [];
            //用于获取roster默认值
            // for(let i in that.nowEdit){
            //     rosterArr.push(that.nowEdit[i].rosterDetailId || -1)
            // }
            axios.post(env + '/roster/getShopAndRosterInfo', {
                "staffId": that.currentStaffId,
                "shopId": this.shopSelect,
                //"rosterDetailIds":rosterArr
            })
                .then(function (response) {
                    //设置shopList rosterList
                    that.editData = [
                        response.data.messages,
                        response.data.messages,
                        response.data.messages,
                        response.data.messages,
                        response.data.messages,
                        response.data.messages,
                        response.data.messages
                    ];
                    //设置typeList
                    that.editTypeList = response.data.messages.typeList;
                    callback();
                })
                .catch(function (error) {

                })
        },
        /**
         * @description 设置接口返回的时间
        */
        setRowTime(row, editDefault) {
            let that = this;
            let forms = $('.form-control-hang');
            forms.eq(row * 4).val(that.nowEdit[row].workingStartTime || editDefault.workingStartTime)
            forms.eq(row * 4 + 1).val(that.nowEdit[row].workingEndTime || editDefault.workingEndTime)
            forms.eq(row * 4 + 2).val(that.nowEdit[row].lunchStartTime || editDefault.lunchStartTime)
            forms.eq(row * 4 + 3).val(that.nowEdit[row].lunchEndTime || editDefault.lunchEndTime)
        },
        /**
         * @description 拉取编辑框商店数据
        */
        fetchEditShop(callback) {
            let that = this;
            axios.post(env + '/shop/getStaffHomeShopList', {
                "id": that.currentStaffId
            })
                .then(function (response) {
                    //设置shop相关
                    that.setAllEditShop(response.data.messages.shopList);
                    that.setAllEditShopDefault(response.data.messages.currentShopId);
                    //设置
                    that.setAllEditRoster(response.data.messages);
                    that.setAllEditRosterDefault(response.data.messages);

                    callback();
                })
                .catch(function (error) {

                })
        },
        /**
         * @description 设置所有Edit框shop下拉组件
        */
        setAllEditShop(shoplist) {
            let that = this;
            for (let i = 0; i < 7; i++) {
                that.homeShopList[i] = shoplist
            }
        },
        /**
         * @description 设置所有Edit框shop下拉组件默认值
        */
        setAllEditShopDefault(currentShopId) {
            let that = this;
            for (let i = 0; i < 7; i++) {
                that.homeShopSelect[i] = currentShopId;
            }
        },
        /**
         * @description 设置所有Edit框roster下拉组件
        */
        setAllEditRoster(messages) {
            let that = this;
        },
        /**
         * @description 设置所有Edit框roster下拉组件默认值
        */
        setAllEditRosterDefault(messages) {
            let that = this;
        },
        rosterChange() {
            let that = this;
        },
        /**
         * @description 清除shop v-model
        */
        cleanShopModel() {
            let that = this;
            that.homeShopSelect = ["", "", "", "", "", "", ""],
                that.homeShopList = [[], [], [], [], [], [], []]
        },
        /**
         * @description 清除 roster v-model
        */
        cleanRosterModel() {
            let that = this;
            that.rosterEditSelect = [{}, {}, {}, {}, {}, {}, {}],
                that.rosterEditList = [[], [], [], [], [], [], []]
        },
        /**
         * @desctription 清空Edit数据，关闭Edit弹框时调用
        */
        clearEditData() {
            let that = this;
            that.editData = [{ shopList: [] }, { shopList: [] }, { shopList: [] }, { shopList: [] }, { shopList: [] }, { shopList: [] }, { shopList: [] }]

        },
        /**
         * @description 日历组建初始化
         * 具体配置项参考
         * https://www.jianshu.com/p/663f2a86dd22
         * jquery datetimepicker配置参数
        */
        dateConfig() {
            let that = this;
            let forms = $('.form-control-hang')
            $('.form-control-hang').datetimepicker({
                format: 'H:i',
                formatTime: 'H:i',
                step: 30,
                timepicker: true,
                datepicker: false,
                onSelectTime: function (dateText, inst) {
                    let d = new Date(dateText);
                    //hour补0
                    let hour = d.getHours() + '';
                    if (hour.length == 1) {
                        hour = '0' + hour
                    }
                    //mins补0
                    let mins = d.getMinutes() + '';
                    if (mins.length == 1) {
                        mins = '0' + mins
                    }
                    let time = hour + ':' + mins;
                    //可获取行列数据
                    let row = inst.attr('row')
                    let col = inst.attr('col')
                    //设置时间
                    $(this).val(time);
                }
            });
        },
        /**
         * @description 清楚所有时间，在隐藏编辑面板时调用
        */
        clearAllEditTime(str) {
            let that = this;
            $('.form-control-hang').val('');
        },
        /**
         * @description 提交一周整表
        */
        submitForm() {
            let that = this;
            let subarr = [];
            var form = $('.form-control-hang')
            for (let i = 0; i < that.nowEdit.length; i++) {
                var obj = that.nowEdit[i];
                obj.workingStartTime = form.eq(4 * i).val();
                obj.workingEndTime = form.eq(4 * i + 1).val();
                obj.lunchStartTime = form.eq(4 * i + 2).val();
                obj.lunchEndTime = form.eq(4 * i + 3).val();
                //当前shop v-model
                obj.shopId = that.nowEdit[i].defaultShopId;
                //当前type v-model
                obj.type = that.editTypeSelect[i];
                //当前周中当前日期applicabelDate
                obj.applicableDate = that.nowEdit[i].applicableDate;
                //当前周中当前日期index
                obj.index = that.nowEdit[i].index;
                //当前选中的rosterId
                obj.rosterId = that.nowEdit[i].defaultRoster.id;//that.rosterEditSelect[i].id;
                obj.staffRosterDetailId = that.nowEdit[i].rosterDetailId;
                delete obj.id;
                subarr.push(obj);
            }
            axios.post(env + '/staffRoster/editStaffRoster', {
                "staffId": that.currentStaffId,
                "staffRosterDetailVOList": subarr
            })
                .then(function (response) {
                    if (response.data.code == 200) {
                        that.hideMask();
                        that.fetchRosterForm({
                            calendarDate: that.monthSelect,
                            staffId: that.staffSelect,
                            shopId: that.shopSelect
                        });
                    }
                    else {
                        alert(response.data.messages.errorMsg)
                    }
                    //that.anMonthFetch('now');
                })
                .catch(function (error) {

                })
        },


    }
})

/*112
var messages = {
    "allShopList" : [
        {
            currentShopID : 26,
            shopList:[
                {
                    rosterDefault : { id:2,lunchEndTime: "13:00" },
                    reosterList:[
                        {
                            text: 'Moring',
                            value: { id:2,lunchEndTime: "13:00" }
                        },
                        {
                            text: 'Moring',
                            value: { id:2,lunchEndTime: "13:00" }
                        }
                    ]
                },
                {
                    rosterDefault : { id:2,lunchEndTime: "13:00" },
                    reosterList:[
                        {
                            text: 'Moring',
                            value: { id:2,lunchEndTime: "13:00" }
                        },
                        {
                            text: 'Moring',
                            value: { id:2,lunchEndTime: "13:00" }
                        }
                    ]
                }
            ]
        },
        {
            currentShopID : 26,
            shopList:[]
        },
        {
            currentShopID : 26,
            shopList:[]
        },
        {
            currentShopID : 26,
            shopList:[]
        }
    ],
    typeList: [{},{}]
}
*/