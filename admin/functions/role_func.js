const DS                = require('../../repository/datastore');

const ROLES             = [
  {
    id          : 0,
    description : 'tab trang chủ'
  },
  {
    id          : 1,
    description : 'tab danh sách vật phẩm'
  },
  {
    id          : 2,
    description : 'tab kiểm tra mã dự thưởng'
  },
  {
    id          : 3,
    description : 'tab thêm quà đặc biệt'
  },
  {
    id          : 4,
    description : 'tab mở khóa acc'
  },
  {
    id          : 5,
    description : 'tab thông tin user'
  },
  {
    id          : 6,
    description : 'tab config'
  },
  {
    id          : 7,
    description : 'tab permission'
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

exports.updateRole = async (mailer, roles) => {
  let mailerDS = await DS.DSGetMailer('administrators', mailer);
  if (mailerDS === null || mailerDS === undefined) return { status: false, msg: `${mailer} is exist!` };


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