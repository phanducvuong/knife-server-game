const DS                = require('../../repository/datastore');

const ROLES             = [
  {
    id          : 0,
    description : 'tab trang chủ',
    redirect    : '/api/v1/admin/dashboard'
  },
  {
    id          : 1,
    description : 'tab danh sách vật phẩm',
    redirect    : '/api/v1/admin/item/get-all-item'
  },
  {
    id          : 2,
    description : 'tab kiểm tra mã dự thưởng',
    redirect    : '/api/v1/admin/code'
  },
  {
    id          : 3,
    description : 'tab thêm quà đặc biệt',
    redirect    : '/api/v1/admin/item/view-add-special-item'
  },
  {
    id          : 4,
    description : 'tab mở khóa acc',
    redirect    : '/api/v1/admin/unlock'
  },
  {
    id          : 5,
    description : 'tab thông tin user',
    redirect    : '/api/v1/admin/user-info/general'
  },
  {
    id          : 6,
    description : 'tab config',
    redirect    : '/api/v1/admin/setup/get-config-partition'
  },
  {
    id          : 7,
    description : 'tab permission',
    redirect    : '/api/v1/admin/role'
  }
];

exports.getAllUserAdmin = async () => {
  let users   = [];
  let result  = await DS.DSGetAllUserAdmin();
  for (let u of result) {
    users.push({
      mailer  : u['mail'],
      name    : u['name'],
      roles   : getNameRoleUser(u['role'])
    });
  }
  return users;
}

exports.chkRolesRequest = (roles) => {
  let tmp = [];
  for (let r of roles) {
    let roleFind = ROLES.find(e => { return e['id'] === r });
    if (roleFind !== null && roleFind !== undefined) {
      tmp.push(roleFind['id']);
    }
  }
  return tmp;
}

exports.isFullControl = (roles) => {
  return roles.length === ROLES.length;
}

exports.GETROLES = () => {
  return ROLES;
}

//----------------------------------------------function-----------------------------------
function getNameRoleUser(roles) {
  let tmps = [];
  for (let r of roles) {
    let roleFind = ROLES.find(e => { return e['id'] === r });
    if (roleFind !== null && roleFind !== undefined) {
      tmps.push(roleFind['description']);
    }
  }
  return tmps;
}